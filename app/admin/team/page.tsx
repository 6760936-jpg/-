import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createStaffAction, updateStaffAction } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";
const labels: Record<string,string> = { DIRECTOR: "Генеральный директор", ADMIN: "Администратор", FIELD: "Выездной сотрудник", DRIVER: "Водитель", WAREHOUSE: "Кладовщик", MANAGER: "Менеджер", CUSTOMER: "Клиент", SUPPLIER: "Поставщик" };

export default async function TeamPage() {
  const current = await requireAdmin();
  const users = await prisma.user.findMany({ where: { role: { not: "CUSTOMER" } }, orderBy: { createdAt: "asc" } });
  const roles = current.role === "DIRECTOR" ? ["ADMIN", "FIELD", "DRIVER", "MANAGER", "WAREHOUSE"] : ["FIELD", "DRIVER", "MANAGER", "WAREHOUSE"];
  return <div className="p-4 sm:p-6 lg:p-10">
    <div><p className="eyebrow">Доступы</p><h1 className="mt-2 text-3xl font-semibold">Сотрудники и роли</h1><p className="mt-2 text-zinc-500">Создавайте учётные записи водителей и сотрудников. Финансы остаются доступны только генеральному директору.</p></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[380px_1fr]">
      <form action={createStaffAction} className="surface-card h-fit space-y-4 p-5">
        <h2 className="font-semibold">Новый сотрудник</h2>
        <label><span className="field-label">Имя</span><input className="input" name="name" required /></label>
        <label><span className="field-label">Телефон / логин</span><input className="input" name="phone" type="tel" required /></label>
        <label><span className="field-label">Роль</span><select className="input" name="role">{roles.map(role => <option key={role} value={role}>{labels[role]}</option>)}</select></label>
        <label><span className="field-label">Временный пароль</span><input className="input" name="password" type="password" minLength={8} required /></label>
        <button className="button-primary w-full">Создать сотрудника</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{users.map((u) => <article key={u.id} className="surface-card p-5"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-violet-100 text-lg font-semibold text-violet-800">{u.name.slice(0,1)}</span><div><h2 className="font-semibold">{u.name}</h2><p className="text-sm text-zinc-500">{u.phone}</p></div></div><div className="mt-4"><span className="admin-chip">{labels[u.role] ?? u.role}</span></div>{u.role !== "DIRECTOR" && roles.includes(u.role) ? <form action={updateStaffAction} className="mt-5 space-y-3 border-t border-zinc-100 pt-4"><input type="hidden" name="id" value={u.id}/><label><span className="field-label">Имя</span><input className="input" name="name" defaultValue={u.name}/></label><label><span className="field-label">Роль</span><select className="input" name="role" defaultValue={u.role}>{roles.map(role => <option key={role} value={role}>{labels[role]}</option>)}</select></label><label><span className="field-label">Доступ</span><select className="input" name="active" defaultValue={String(u.active)}><option value="true">Активен</option><option value="false">Отключён</option></select></label><label><span className="field-label">Новый пароль (если нужно)</span><input className="input" name="password" type="password" minLength={8} placeholder="Оставьте пустым"/></label><button className="button-secondary w-full">Сохранить</button></form> : <p className="mt-5 border-t border-zinc-100 pt-4 text-xs text-zinc-500">Учётная запись генерального директора не изменяется этим экраном.</p>}</article>)}</div>
    </div>
  </div>;
}
