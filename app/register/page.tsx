import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Регистрация магазина" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/profile";
  if (user) redirect(nextPath);
  return <div className="container-page min-h-[75vh]"><div className="mx-auto max-w-2xl"><div className="mb-8 text-center"><p className="eyebrow">Новый магазин</p><h1 className="mt-3 text-3xl font-semibold">Регистрация в ПЕРСПЕКТИВЕ</h1><p className="mt-3 leading-7 text-zinc-500">Укажите адрес и точное местоположение магазина на карте. Геолокация нужна для правильной доставки и маршрутов водителя.</p></div><AuthForm mode="register" nextPath={nextPath} /></div></div>;
}
