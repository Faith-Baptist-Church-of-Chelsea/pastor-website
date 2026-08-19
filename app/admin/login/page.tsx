import LoginForm from "@/components/admin/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; from?: string }>;
}) {
  const { next, from } = await searchParams;
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-3xl">Sign in</h1>
      <p className="mt-2 text-slate-600">
        The same sign-in you use to edit the website gets you in here.
      </p>

      {from === "github" && (
        <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          That GitHub account doesn&rsquo;t have access to this website yet. Ask
          Steven to add it, then try again.
        </p>
      )}

      <a
        href="/api/keystatic/github/login"
        className="mt-6 flex items-center justify-center gap-3 rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg>
        Sign in with GitHub
      </a>
      <p className="mt-3 text-sm text-slate-600">
        Already signed in to the site editor?{" "}
        <a href={next ?? "/admin"} className="font-semibold text-brand-700 hover:underline">
          Carry on to the devotions
        </a>
        .
      </p>

      <details className="mt-10 text-sm">
        <summary className="cursor-pointer text-slate-500 hover:text-slate-800">
          Use the devotions password instead
        </summary>
        <p className="mt-2 text-slate-600">
          A way in when GitHub is unreachable.
        </p>
        <LoginForm next={next ?? "/admin"} />
      </details>
    </div>
  );
}
