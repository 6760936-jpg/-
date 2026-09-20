export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  sortOrder: number;
};

export type Product = {
  id: number;
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
  category: Category;
};

export type ProductFormValues = {
  name: string;
  article: string;
  price: string;
  oldPrice: string;
  purchasePrice: string;
  stock: string;
  minOrder: string;
  description: string;
  categoryId: string;
  image: string;
  isNew: boolean;
  isHit: boolean;
  isSuperPrice: boolean;
  active: boolean;
};

export type ApiError = { error: string; details?: Record<string, string> };

export type CartItem = Product & { quantity: number };

export type OrderItem = {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  article: string;
  price: number;
  purchasePrice: number;
  quantity: number;
};

export type Order = {
  id: number;
  userId: number;
  storeId: number | null;
  status: string;
  paymentStatus: string;
  comment: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  user: { id: number; name: string; phone: string; shopName: string };
  store?: { id: number; name: string; address: string } | null;
  items: OrderItem[];
};
