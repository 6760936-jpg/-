import { CheckoutClient } from "@/components/CheckoutClient";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Оформление заказа" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  return <CheckoutClient user={user} />;
}
