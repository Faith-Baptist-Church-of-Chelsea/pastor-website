// Opt-in encrypted sync.
//
// The rule this whole file exists to keep: the server must never be able
// to read a journal entry. So the passphrase never leaves the device, the
// encryption key is derived from it locally, and only AES-GCM ciphertext
// is uploaded. What the server sees is an email address, a salt, a
// verifier (which proves knowledge of the passphrase without revealing
// it), and opaque blobs with dates attached so they can be merged.
//
// The unavoidable cost: a forgotten passphrase means the synced copy is
// gone for good. Anything that could undo that would also let the server
// read the entries. The UI says so plainly and pushes people to export.
import { allEntries, getEntry, saveEntry, type Entry } from "./store";

const ITERATIONS = 250_000;

function b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

// Explicitly ArrayBuffer-backed: WebCrypto's types reject the
// SharedArrayBuffer-compatible default that Uint8Array.from produces.
function unb64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(n));
  crypto.getRandomValues(bytes);
  return bytes;
}

async function deriveBits(passphrase: string, salt: Uint8Array, info: string) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  const infoBytes = new TextEncoder().encode(info);
  const saltBytes = new Uint8Array(new ArrayBuffer(salt.length + infoBytes.length));
  saltBytes.set(salt, 0);
  saltBytes.set(infoBytes, salt.length);
  return { base, saltBytes };
}

/** The AES key used to encrypt entries. Never transmitted, never stored. */
export async function deriveKey(passphrase: string, saltB64: string): Promise<CryptoKey> {
  const { base, saltBytes } = await deriveBits(passphrase, unb64(saltB64), "entries");
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Proves to the server that this device knows the passphrase. Derived with
 * a different info string than the encryption key, so holding the verifier
 * tells you nothing useful about the key.
 */
export async function deriveVerifier(passphrase: string, saltB64: string): Promise<string> {
  const { base, saltBytes } = await deriveBits(passphrase, unb64(saltB64), "verifier");
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    256
  );
  return b64(bits);
}

export function newSalt(): string {
  return b64(randomBytes(16).buffer);
}

async function encryptEntry(key: CryptoKey, entry: Entry) {
  const iv = randomBytes(12);
  const data = new TextEncoder().encode(JSON.stringify(entry));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { entryDate: entry.date, ciphertext: b64(ct), iv: b64(iv.buffer) };
}

async function decryptEntry(key: CryptoKey, blob: { ciphertext: string; iv: string }) {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(blob.iv) },
    key,
    unb64(blob.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(plain)) as Entry;
}

async function call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch("/api/journal/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Sync failed.");
  return body as T;
}

/** Creates the account. Returns the salt so the caller can derive the key. */
export async function register(email: string, passphrase: string) {
  const kdfSalt = newSalt();
  const verifier = await deriveVerifier(passphrase, kdfSalt);
  await call("register", { email, kdfSalt, verifier });
  return { kdfSalt, key: await deriveKey(passphrase, kdfSalt) };
}

/** Signs in on another device. Throws if the passphrase is wrong. */
export async function login(email: string, passphrase: string) {
  const { kdfSalt } = await call<{ kdfSalt: string }>("salt", { email });
  const verifier = await deriveVerifier(passphrase, kdfSalt);
  await call("login", { email, verifier });
  return { kdfSalt, key: await deriveKey(passphrase, kdfSalt) };
}

export async function logout() {
  await call("logout");
}

/**
 * Two-way sync. Uploads everything local, pulls everything remote, and
 * merges by whichever copy was edited most recently.
 */
export async function syncNow(key: CryptoKey): Promise<{ pushed: number; pulled: number }> {
  const local = await allEntries();
  const blobs = await Promise.all(local.map((e) => encryptEntry(key, e)));
  await call("push", { blobs });

  const { blobs: remote } = await call<{
    blobs: { entryDate: string; ciphertext: string; iv: string }[];
  }>("pull");

  let pulled = 0;
  for (const blob of remote) {
    try {
      const entry = await decryptEntry(key, blob);
      const existing = await getEntry(entry.date);
      if (!existing || (entry.updatedAt ?? "") > (existing.updatedAt ?? "")) {
        await saveEntry(entry);
        pulled++;
      }
    } catch {
      // A blob we can't decrypt means the wrong passphrase for that data.
      // Skip it rather than destroying anything local.
    }
  }
  return { pushed: blobs.length, pulled };
}
