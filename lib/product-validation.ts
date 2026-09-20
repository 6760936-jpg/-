type ProductInput = {
  name?: unknown;
  article?: unknown;
  price?: unknown;
  oldPrice?: unknown;
  purchasePrice?: unknown;
  stock?: unknown;
  minOrder?: unknown;
  image?: unknown;
  description?: unknown;
  categoryId?: unknown;
  isNew?: unknown;
  isHit?: unknown;
  isSuperPrice?: unknown;
  active?: unknown;
};

type ProductData = {
  name: string;
  article: string;
  price: number;
  oldPrice: number | null;
  purchasePrice: number;
  stock: number;
  minOrder: number;
  image: string | null;
  description: string | null;
  categoryId: number;
  isNew: boolean;
  isHit: boolean;
  isSuperPrice: boolean;
  active: boolean;
};

export function validateProductInput(input: ProductInput): { ok: true; data: ProductData } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const article = typeof input.article === "string" ? input.article.trim().toUpperCase() : "";
  const price = Number(input.price);
  const oldPriceRaw = input.oldPrice === "" || input.oldPrice == null ? null : Number(input.oldPrice);
  const purchasePrice = Number(input.purchasePrice ?? 0);
  const stock = Number(input.stock);
  const minOrder = Number(input.minOrder ?? 1);
  const categoryId = Number(input.categoryId);
  const image = typeof input.image === "string" && input.image.trim() ? input.image.trim() : null;
  const description = typeof input.description === "string" && input.description.trim() ? input.description.trim() : null;

  if (name.length < 2 || name.length > 160) errors.name = "Название должно содержать от 2 до 160 символов.";
  if (!/^[A-ZА-Я0-9_-]{2,64}$/i.test(article)) errors.article = "Используйте буквы, цифры, дефис или подчёркивание.";
  if (!Number.isFinite(price) || price < 0) errors.price = "Укажите корректную цену.";
  if (oldPriceRaw !== null && (!Number.isFinite(oldPriceRaw) || oldPriceRaw < 0)) errors.oldPrice = "Укажите корректную старую цену.";
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) errors.purchasePrice = "Укажите корректную закупочную цену.";
  if (!Number.isInteger(stock) || stock < 0) errors.stock = "Остаток должен быть целым неотрицательным числом.";
  if (!Number.isInteger(minOrder) || minOrder < 1) errors.minOrder = "Минимальный заказ должен быть не меньше 1.";
  if (!Number.isInteger(categoryId) || categoryId < 1) errors.categoryId = "Выберите категорию.";
  if (description && description.length > 5000) errors.description = "Описание слишком длинное.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name,
      article,
      price,
      oldPrice: oldPriceRaw,
      purchasePrice,
      stock,
      minOrder,
      image,
      description,
      categoryId,
      isNew: Boolean(input.isNew),
      isHit: Boolean(input.isHit),
      isSuperPrice: Boolean(input.isSuperPrice),
      active: input.active === undefined ? true : Boolean(input.active),
    },
  };
}
