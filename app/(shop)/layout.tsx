import { CartProvider } from "./cart/CartContext";
import { CheckoutProvider } from "./checkout/CheckoutContext";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <CheckoutProvider>{children}</CheckoutProvider>
    </CartProvider>
  );
}