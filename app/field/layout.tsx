import Image from "next/image";
import Link from "next/link";
import { requireField } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  const user = await requireField();
  return <div className="min-h-screen bg-zinc-100">
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-zinc-950 text-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-10">
        <Link href="/field" className="mr-2"><span className="relative block h-10 w-[170px] overflow-hidden rounded-lg bg-[#090a11]"><Image src="/brand/perspektiva-logo.png" alt="ПЕРСПЕКТИВА" fill sizes="170px" className="scale-[1.45] object-cover object-center" /></span></Link>
        <nav className="flex flex-1 flex-wrap gap-1"><Link href="/field" className="rounded-lg px-3 py-2 text-sm hover:bg-white/10">Маршруты</Link><Link href="/field/map" className="rounded-lg px-3 py-2 text-sm hover:bg-white/10">Карта магазинов</Link><Link href="/field/catalog" className="rounded-lg px-3 py-2 text-sm hover:bg-white/10">Товар</Link><Link href="/field/stores/new" className="rounded-lg px-3 py-2 text-sm hover:bg-white/10">+ Магазин</Link>{["DIRECTOR","ADMIN"].includes(user.role)&&<Link href="/admin" className="rounded-lg px-3 py-2 text-sm hover:bg-white/10">Управление</Link>}</nav>
        <span className="hidden text-xs text-zinc-400 md:block">{user.name}</span><LogoutButton />
      </div>
    </header>
    {children}
  </div>;
}
