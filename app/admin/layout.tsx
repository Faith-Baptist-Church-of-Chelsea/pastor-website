import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = {
  title: "Devotions Admin",
  robots: { index: false, follow: false },
};

// The admin area sits outside the (site) group on purpose: no public
// header, no footer, no scroll animations — just the work.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <AdminHeader
        title="Devotions Admin"
        homeHref="/admin"
        viewHref="/devotions"
        viewLabel="View public page"
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
