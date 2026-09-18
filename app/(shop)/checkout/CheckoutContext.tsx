"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ShippingDetails = {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
};

type CheckoutContextValue = {
  shipping: ShippingDetails | null;
  setShipping: (details: ShippingDetails) => void;
};

const CheckoutContext = createContext<CheckoutContextValue | undefined>(
  undefined
);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [shipping, setShipping] = useState<ShippingDetails | null>(null);
  return (
    <CheckoutContext.Provider value={{ shipping, setShipping }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return ctx;
}