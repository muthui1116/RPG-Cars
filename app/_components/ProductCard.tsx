import Image from "next/image";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  category: string | null;
  description: string | null;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <li className="group min-w-0 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="p-3 space-y-1">
          {product.category && (
            <span className="inline-block text-[11px] font-medium uppercase tracking-wide text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
              {product.category}
            </span>
          )}

          <h3 className="font-semibold text-gray-900 truncate">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-sm text-gray-500 line-clamp-2">
              {product.description}
            </p>
          )}

          <p className="pt-1 text-base font-bold text-gray-900">
            ${Number(product.price).toFixed(2)}
          </p>
        </div>
      </Link>
    </li>
  );
}