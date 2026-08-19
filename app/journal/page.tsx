import JournalApp from "@/components/journal/JournalApp";

// Everything here runs on the device — the page itself is a shell so the
// journal can be opened with no network once it's been installed.
export default function JournalPage() {
  return <JournalApp />;
}
