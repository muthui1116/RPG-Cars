"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../cart/CartContext";
import { useCheckout } from "../CheckoutContext";
import { placeOrder, getOrderPaymentStatus } from "../actions";

export default function PlaceOrderPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { shipping } = useCheckout();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [awaitingPayment, setAwaitingPayment] = useState<{
    orderId: string;
  } | null>(null);

  useEffect(() => {
    if (!shipping || items.length === 0) {
      router.replace("/checkout");
    }
  }, [shipping, items.length, router]);

  function handlePlaceOrder() {
    if (!shipping) return;
    setError(null);

    startTransition(async () => {
      const result = await placeOrder({
        customer: shipping,
        items: items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        totalPrice,
      });

      if (!result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      setAwaitingPayment({ orderId: result.orderId });
    });
  }

  useEffect(() => {
    if (!awaitingPayment) return;
    let isCancelled = false;

    const interval = setInterval(async () => {
      try {
        const status = await getOrderPaymentStatus(awaitingPayment.orderId);
        if (isCancelled) return;

        if (status === "paid") {
          clearInterval(interval);
          clearCart();
          router.push(`/checkout/success?orderId=${awaitingPayment.orderId}`);
        } else if (status === "failed") {
          clearInterval(interval);
          setAwaitingPayment(null);
          setError("Payment was not completed. Please try again.");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isCancelled) {
        setError("Payment timed out. Please try again.");
        setAwaitingPayment(null);
      }
    }, 120000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [awaitingPayment, router, clearCart]);

  if (!shipping) return null;

  if (awaitingPayment) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Check your phone</h1>
        <p className="text-gray-600">
          Enter your M-Pesa PIN on the prompt sent to {shipping.phone} to
          complete payment.
        </p>
        <div className="animate-pulse text-sm text-gray-400">
          Waiting for confirmation...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Review your order</h1>

      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Shipping to</h2>
          <button
            onClick={() => router.push("/checkout")}
            className="text-sm text-gray-600 underline"
          >
            Edit
          </button>
        </div>
        <p className="text-sm text-gray-700">{shipping.fullName}</p>
        <p className="text-sm text-gray-700">{shipping.address}</p>
        <p className="text-sm text-gray-700">
          {shipping.city}, {shipping.postalCode}
        </p>
        <p className="text-sm text-gray-700">{shipping.email}</p>
        <p className="text-sm text-gray-700">{shipping.phone}</p>
      </div>

      <div>
        <h2 className="font-bold text-gray-900 mb-3">Items</h2>
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-14 h-14 object-cover rounded-md"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">Qty {item.quantity}</p>
              </div>
              <span className="text-sm font-medium text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <span className="text-lg font-bold text-gray-900">Total</span>
        <span className="text-lg font-bold text-gray-900">
          ${totalPrice.toFixed(2)}
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handlePlaceOrder}
        disabled={isPending}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
      >
        {isPending ? "Sending M-Pesa prompt..." : "Place Order — Pay with M-Pesa"}
      </button>
    </div>
  );
}