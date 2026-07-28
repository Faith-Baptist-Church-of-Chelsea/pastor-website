// Shared dark page banner: title + optional line under it.
export default function PageHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <h1 className="animate-rise animate-rise-1 text-4xl sm:text-5xl">{title}</h1>
        {subtitle && (
          <p className="animate-rise animate-rise-2 mt-4 max-w-2xl text-lg text-slate-300">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
