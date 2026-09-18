"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../cart/CartContext";
import { placeOrder, getOrderPaymentStatus } from "./actions";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [awaitingPayment, setAwaitingPayment] = useState<{
    orderId: string;
  } | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    startTransition(async () => {
      const result = await placeOrder({
        customer: form,
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

  // Poll for payment confirmation once STK push has been sent
  useEffect(() => {
    if (!awaitingPayment) return;

    const interval = setInterval(async () => {
      const status = await getOrderPaymentStatus(awaitingPayment.orderId);

      if (status === "paid") {
        clearInterval(interval);
        clearCart();
        router.push(`/checkout/success?orderId=${awaitingPayment.orderId}`);
      } else if (status === "failed") {
        clearInterval(interval);
        setAwaitingPayment(null);
        setError("Payment was not completed. Please try again.");
      }
    }, 3000);

    // Stop polling after ~2 minutes (STK push expires around then)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (awaitingPayment) {
        setError("Payment timed out. Please try again.");
        setAwaitingPayment(null);
      }
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [awaitingPayment, router, clearCart]);

  if (awaitingPayment) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Check your phone</h1>
        <p className="text-gray-600">
          Enter your M-Pesa PIN on the prompt sent to your phone to complete
          payment.
        </p>
        <div className="animate-pulse text-sm text-gray-400">
          Waiting for confirmation...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ...same fields as before... */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input type="text" name="fullName" required value={form.fullName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" name="address" required value={form.address} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" name="city" required value={form.city} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal code</label>
              <input type="text" name="postalCode" required value={form.postalCode} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              M-Pesa phone number
            </label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="0712345678"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={isPending} className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-60">
            {isPending ? "Sending M-Pesa prompt..." : "Pay with M-Pesa"}
          </button>
        </form>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 h-fit">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between py-3 text-sm">
              <span className="text-gray-700">{item.name} × {item.quantity}</span>
              <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-gray-200 mt-4 pt-4">
          <span className="font-bold text-gray-900">Total</span>
          <span className="font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}