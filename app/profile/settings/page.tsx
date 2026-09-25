import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/phone";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";

export const metadata = { title: "Профиль" };
export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const user = await requireUser("/profile/settings");

  const membership = await prisma.storeMembership.findFirst({
    where: { userId: user.id, active: true },
    include: { store: { include: { shelves: true } } },
  });

  return (
    <div className="container-page max-w-3xl">
      <div className="mb-8">
        <p className="eyebrow">Мой профиль</p>
        <h1 className="mt-2 text-3xl font-semibold">
          Данные аккаунта
        </h1>
        <p className="mt-2 text-zinc-500">
          Контакты, адрес и данные торговой точки.
        </p>
      </div>

      <ProfileSettingsForm
        initialName={user.name}
        initialShopName={user.shopName}
        initialPhone={formatPhone(user.phone)}
        hasStore={Boolean(membership)}
        initialAddress={membership?.store.address ?? ""}
        initialLatitude={membership?.store.latitude ?? null}
        initialLongitude={membership?.store.longitude ?? null}
      />
    </div>
  );
}