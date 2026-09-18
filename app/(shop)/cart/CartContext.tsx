"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity">; quantity?: number }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SET_CART"; payload: CartItem[] };

const CART_STORAGE_KEY = "cart";

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const qty = action.quantity ?? 1;
      const existing = state.items.find((i) => i.id === action.payload.id);

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + qty }
              : i
          ),
        };
      }

      return {
        items: [...state.items, { ...action.payload, quantity: qty }],
      };
    }

    case "REMOVE_ITEM":
      return {
        items: state.items.filter((i) => i.id !== action.payload.id),
      };

    case "UPDATE_QUANTITY":
      if (action.payload.quantity <= 0) {
        return {
          items: state.items.filter((i) => i.id !== action.payload.id),
        };
      }
      return {
        items: state.items.map((i) =>
          i.id === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };

    case "CLEAR_CART":
      return { items: [] };

    case "SET_CART":
      return { items: action.payload };

    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        dispatch({ type: "SET_CART", payload: JSON.parse(stored) });
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const totalItems = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );

  const totalPrice = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [state.items]
  );

  const value: CartContextValue = {
    items: state.items,
    totalItems,
    totalPrice,
    addItem: (item, quantity = 1) =>
      dispatch({ type: "ADD_ITEM", payload: item, quantity }),
    removeItem: (id) => dispatch({ type: "REMOVE_ITEM", payload: { id } }),
    updateQuantity: (id, quantity) =>
      dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } }),
    clearCart: () => dispatch({ type: "CLEAR_CART" }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}