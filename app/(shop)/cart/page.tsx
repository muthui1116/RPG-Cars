"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "./CartContext";

export default function CartPage() {
  const { items, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-gray-600">Please sign in to view your cart.</p>
        <Link
          href={`/api/auth/signin?callbackUrl=${encodeURIComponent("/cart")}`}
          className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Your cart is empty.</p>
        <Link href="/" className="text-gray-900 underline mt-2 inline-block">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>

      <ul className="divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-md"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-500">
                ${item.price.toFixed(2)} each
              </p>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) =>
                updateQuantity(item.id, Number(e.target.value))
              }
              className="w-16 border border-gray-300 rounded-md px-2 py-1 text-center"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <span className="text-lg font-bold text-gray-900">
          Total: ${totalPrice.toFixed(2)}
        </span>
        <div className="space-x-4">
          <button onClick={clearCart} className="text-sm text-gray-500 hover:underline">
            Clear cart
          </button>
          <Link
            href="/checkout"
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}