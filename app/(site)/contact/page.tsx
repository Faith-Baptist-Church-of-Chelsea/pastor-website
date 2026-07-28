import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Pastor M. Adam Summers.",
};

export default async function ContactPage() {
  const site = await getSite();
  return (
    <main className="flex-1">
      <PageHero
        title="Contact Pastor Summers"
        subtitle="Questions, encouragement, or a request to join the update list — every email is read."
      />
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg">Email</h2>
            <p className="mt-2 text-sm text-slate-600">
              The best way to reach Pastor Summers directly.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-4 inline-block break-all rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
            >
              {site.email}
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg">Subscribe to Updates</h2>
            <p className="mt-2 text-sm text-slate-600">{site.subscribeBlurb}</p>
            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent("Subscribe me to weekly updates")}`}
              className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
            >
              Subscribe by Email
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg">Visit the Church</h2>
            <p className="mt-2 text-sm text-slate-600">
              {site.church.name} in {site.church.city} — service times and
              directions are on the church website.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={site.church.url ?? "#"}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
              >
                Church Website
              </a>
              <a
                href={site.facebook ?? "#"}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
