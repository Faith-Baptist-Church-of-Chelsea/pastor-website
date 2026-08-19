import LoginForm from "@/components/admin/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
      <h1 className="text-3xl">Sign in</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter the devotions password to review what people have shared.
      </p>
      <LoginForm next={next ?? "/admin"} />
    </div>
  );
}
