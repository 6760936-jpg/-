"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type FieldCartItem = {
  productId: number;
  name: string;
  article: string;
  price: number;
  image: string | null;
  quantity: number;
  maxQuantity: number;
};

type FieldCartValue = {
  items: FieldCartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: FieldCartItem) => void;
  removeItem: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "perspektiva-field-cart-v1";
const FieldCartContext = createContext<FieldCartValue | null>(null);

function isValidItem(value: unknown): value is FieldCartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as FieldCartItem;
  return (
    typeof item.productId === "number" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    typeof item.quantity === "number" &&
    item.quantity > 0
  );
}

export function FieldCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FieldCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed.filter(isValidItem));
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [hydrated, items]);

  const addItem = useCallback((item: FieldCartItem) => {
    setItems((current) => {
      const existing = current.find((i) => i.productId === item.productId);
      if (!existing) return [...current, item];
      return current.map((i) =>
        i.productId === item.productId
          ? {
              ...i,
              quantity: Math.min(i.quantity + item.quantity, i.maxQuantity),
            }
          : i,
      );
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((current) => current.filter((i) => i.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setItems((current) =>
      current.flatMap((i) => {
        if (i.productId !== productId) return [i];
        if (quantity <= 0) return [];
        return [{ ...i, quantity: Math.min(quantity, i.maxQuantity) }];
      }),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<FieldCartValue>(() => {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
    return {
      items,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    };
  }, [items, addItem, removeItem, setQuantity, clearCart]);

  return (
    <FieldCartContext.Provider value={value}>
      {children}
    </FieldCartContext.Provider>
  );
}

export function useFieldCart(): FieldCartValue {
  const context = useContext(FieldCartContext);
  if (!context) {
    throw new Error("useFieldCart должен использоваться внутри FieldCartProvider");
  }
  return context;
}