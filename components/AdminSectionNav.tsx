import Link from "next/link";

type AdminSectionNavProps = {
  active: "products" | "orders";
};

const links = [
  { key: "products" as const, href: "/admin", label: "Товары" },
  { key: "orders" as const, href: "/admin/orders", label: "Заказы" },
];

export function AdminSectionNav({ active }: AdminSectionNavProps) {
  return (
    <nav className="mb-8 flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Разделы админки">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
            active === link.key
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
