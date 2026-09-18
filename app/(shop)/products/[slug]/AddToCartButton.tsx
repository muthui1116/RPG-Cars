"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "../../cart/CartContext";

type AddToCartButtonProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image_url: string;
  };
};

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function handleAddToCart() {
    if (status === "loading") return;

    if (!session) {
      // send them to sign in, then bring them right back to this product
      const callbackUrl = `/products/${product.slug}`;
      router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    setPending(true);
    addItem(product);
    router.push("/cart");
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={status === "loading" || pending}
      className="mt-4 w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
    >
      {status === "loading"
        ? "Loading..."
        : session
        ? "Add to Cart"
        : "Sign in to Add to Cart"}
    </button>
  );
}