import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/profile";
  if (user) {
    if (["DIRECTOR", "ADMIN"].includes(user.role) && nextPath === "/profile") redirect("/admin");
    if (["FIELD", "DRIVER"].includes(user.role) && nextPath === "/profile") redirect("/field");
    redirect(nextPath);
  }
  return (
    <div className="container-page min-h-[75vh]">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="eyebrow">Личный кабинет</p>
          <h1 className="mt-3 text-3xl font-semibold">Вход в ПЕРСПЕКТИВУ</h1>
          <p className="mt-3 text-zinc-500">Телефон является логином.</p>
        </div>
        <AuthForm mode="login" nextPath={nextPath} />
      </div>
    </div>
  );
}
