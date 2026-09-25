import { requireUser } from "@/lib/auth";
import { ProfileShell } from "@/components/ProfileShell";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/profile");

  return (
    <ProfileShell user={{ name: user.name, role: user.role }}>
      {children}
    </ProfileShell>
  );
}