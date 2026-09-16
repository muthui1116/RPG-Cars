// app/products/[slug]/page.tsx
import { notFound } from "next/navigation";
import db from "../../../lib/db";
import ProductGallery from "./ProductGallery";

type ProductDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { slug } = await params;

  const productResult = await db.query(
    `SELECT id, name, slug, price, image_url, category, description
     FROM products
     WHERE slug = $1 AND is_active = true
     LIMIT 1`,
    [slug]
  );

  const product = productResult.rows[0];

  if (!product) {
    notFound();
  }

  // Fetch any extra gallery images for this product
  const galleryResult = await db.query(
    `SELECT image_url FROM product_images
     WHERE product_id = $1
     ORDER BY sort_order ASC`,
    [product.id]
  );

  // Combine the main image with the extra gallery images into one array.
  // The main image always comes first and we keep at least four entries
  // so the gallery always shows a full product image set.
  const galleryImages = [
    product.image_url,
    ...galleryResult.rows.map((row) => row.image_url),
  ];

  while (galleryImages.length < 4) {
    galleryImages.push(product.image_url);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image + gallery (client component, handles clicking) */}
        <ProductGallery images={galleryImages} productName={product.name} />

        {/* Details */}
        <div className="space-y-4">
          {product.category && (
            <span className="inline-block text-[11px] font-medium uppercase tracking-wide text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
              {product.category}
            </span>
          )}

          <h1 className="text-2xl font-bold text-gray-900">
            {product.name}
          </h1>

          <p className="text-xl font-bold text-gray-900">
            ${Number(product.price).toFixed(2)}
          </p>

          {product.description && (
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>
          )}

          <button className="mt-4 w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}