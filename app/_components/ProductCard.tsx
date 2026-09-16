// ProductCard.tsx
import Image from "next/image";
import Link from "next/link";
import EditButton from "./EditButton";
import DeleteButton from "./DeleteButton";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  category: string | null;
  description: string | null;
};

export default function ProductCard({
  product,
  isAdmin = false,
}: {
  product: Product;
  isAdmin?: boolean;
}) {
  return (
    <li className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white h-full">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square bg-gray-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-3">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-sm font-semibold text-gray-900">
          KSh {product.price.toLocaleString()}
        </p>

        <div className="flex-1" />

        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {isAdmin ? (
            <>
              <EditButton product={product} isAdmin={isAdmin} />
              <DeleteButton id={product.id} isAdmin={isAdmin} />
            </>
          ) : (
            <Link
              href={`/products/${product.slug}`}
              className="flex-1 text-center text-sm font-medium text-gray-900 hover:text-white hover:bg-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}