/* eslint-disable react-hooks/set-state-in-effect */
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
import type { Product } from "@/lib/types";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "aromaline-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

function isValidItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as CartItem;
  return (
    item.product != null &&
    typeof item.product.id === "number" &&
    typeof item.product.name === "string" &&
    typeof item.product.price === "number" &&
    typeof item.quantity === "number" &&
    item.quantity > 0
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(isValidItem);
          setItems(cleaned);
          if (cleaned.length !== parsed.length) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          }
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
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

  const addItem = useCallback((product: Product) => {
    if (!product || product.stock <= 0) return;
    setItems((current) => {
      const existing = current.find((item) => item.product?.id === product.id);
      if (!existing) {
        return [
          ...current,
          {
            product,
            quantity: Math.min(product.minOrder || 1, product.stock),
          },
        ];
      }
      return current.map((item) =>
        item.product?.id === product.id
          ? {
              ...item,
              product,
              quantity: Math.min(item.quantity + 1, product.stock),
            }
          : item,
      );
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((current) =>
      current.filter((item) => item.product?.id !== productId),
    );
  }, []);

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setItems((current) =>
      current.flatMap((item) => {
        if (item.product?.id !== productId) return [item];
        if (quantity <= 0) return [];
        return [
          {
            ...item,
            quantity: Math.min(
              Math.max(item.product.minOrder || 1, quantity),
              item.product.stock,
            ),
          },
        ];
      }),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart должен использоваться внутри CartProvider");
  return context;
}