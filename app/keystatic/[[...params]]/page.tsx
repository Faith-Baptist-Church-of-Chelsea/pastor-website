import KeystaticApp from "../keystatic";
import AdminHeader from "@/components/admin/AdminHeader";

// The /keystatic site editor. It renders entirely on the client and sits
// outside the (site) group. It wears the same header as the devotion
// queue, with the editor filling whatever is left of the window below it
// (see .site-editor-frame in globals.css for how that's arranged).
export default function Page() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AdminHeader
        title="Site Editor"
        homeHref="/keystatic"
        viewHref="/"
        viewLabel="View site"
        fullWidth
      />
      <div className="site-editor-frame min-h-0 flex-1">
        <KeystaticApp />
      </div>
    </div>
  );
}
