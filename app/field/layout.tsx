import { requireField } from "@/lib/auth";
import { FieldShell } from "@/components/FieldShell";

export default async function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireField();

  return (
    <FieldShell user={{ name: user.name, role: user.role }}>
      {children}
    </FieldShell>
  );
}