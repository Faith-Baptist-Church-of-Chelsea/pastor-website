import Image from "next/image";
import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import PageHero from "@/components/PageHero";
import MarkdownBody from "@/components/MarkdownBody";
import { getAbout, getPhotos, getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description: "About Pastor M. Adam Summers of Faith Baptist Church, Chelsea, Michigan.",
  ...canonical("/about"),
};

export default async function AboutPage() {
  const [body, site, photos] = await Promise.all([getAbout(), getSite(), getPhotos()]);
  return (
    <main className="flex-1">
      <PageHero
        title="About Pastor Summers"
        subtitle={`Pastor of ${site.church.name} in ${site.church.city} since 2008.`}
      />
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="max-w-2xl">
            <MarkdownBody>{body}</MarkdownBody>
            <Image
              src={photos.signature}
              alt="Pastor Summers' signature"
              width={300}
              height={150}
              className="mt-8 h-auto w-40"
            />
          </div>
          <div className="space-y-6">
            <Image
              src={photos.family}
              alt="The Summers family"
              width={600}
              height={450}
              className="rounded-xl object-cover shadow-md"
            />
            <div className="rounded-xl border border-slate-200 bg-paper p-6">
              <h2 className="text-lg">Visit the Church</h2>
              <p className="mt-2 text-sm text-slate-600">
                {site.church.name} is located in {site.church.city}. Service
                times, directions, and ministries are on the church website.
              </p>
              <a
                href={site.church.url ?? "#"}
                className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
              >
                {site.church.name} →
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
