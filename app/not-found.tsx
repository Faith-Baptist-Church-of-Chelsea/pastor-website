import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="text-center">
        <h1 className="text-4xl">Page Not Found</h1>
        <p className="mt-4 text-slate-600">
          That page doesn&rsquo;t exist — it may have moved when the site was rebuilt.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-500"
        >
          Back to the Homepage
        </Link>
      </div>
    </main>
  );
}
