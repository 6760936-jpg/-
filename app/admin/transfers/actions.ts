"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function transferToDriver(formData: FormData) {
  const driverId = formData.get("driverId") as string;
  const productId = formData.get("productId") as string;
  const quantity = parseInt(formData.get("quantity") as string);

  if (!driverId || !productId || !quantity || quantity <= 0) {
    return { error: "Заполните все поля корректно." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || product.stock < quantity) throw new Error("Недостаточно товара на складе.");

      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } }
      });

      const existing = await tx.driverInventory.findFirst({
        where: { userId: driverId, productId: productId }
      });

      if (existing) {
        await tx.driverInventory.update({
          where: { id: existing.id },
          data: { quantity: { increment: quantity } }
        });
      } else {
        await tx.driverInventory.create({
          data: { userId: driverId, productId: productId, quantity }
        });
      }

      await tx.inventoryMovement.create({
        data: {
          type: "OUT",
          quantity,
          productId,
          userId: driverId,
          note: "Загружено в машину"
        }
      });
    });
    revalidatePath("/admin/transfers");
    revalidatePath("/admin/products");
    return { success: "Товар успешно передан водителю!" };
  } catch (e: any) {
    return { error: e.message || "Ошибка при передаче" };
  }
}