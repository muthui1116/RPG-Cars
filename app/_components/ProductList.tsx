// ProductsList.tsx
import db from "../lib/db";
import { auth } from "../api/[...nextauth]/route";
import { ROLES } from "../lib/roles";
import ProductCard from "./ProductCard";
import AddProductModal from "./AddProductModal";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  category: string | null;
  description: string | null;
};

export default async function ProductsList({ category }: { category?: string }) {
  const session = await auth();
  const isAdmin = Number(session?.user?.role) === ROLES.ADMIN;

  const [result, categoryResult] = await Promise.all([
    db.query<Product>(
      `SELECT id, name, slug, price, image_url, category, description
       FROM products
       WHERE is_active = true
         AND ($1::text IS NULL OR category = $1)
       ORDER BY created_at DESC`,
      [category || null]
    ),
    db.query<{ category: string }>(
      `SELECT DISTINCT category
       FROM products
       WHERE is_active = true AND category IS NOT NULL
       ORDER BY category ASC`
    ),
  ]);

  const products = result.rows;
  const categories = categoryResult.rows;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Products</h2>
        <div className="flex flex-wrap items-center gap-3">
          <form method="get" className="flex items-center gap-3">
            <select
              id="category"
              name="category"
              defaultValue={category ?? ""}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map(({ category: categoryName }) => (
                <option key={categoryName} value={categoryName}>
                  {categoryName}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white"
            >
              Filter
            </button>
          </form>
          {isAdmin && <AddProductModal />}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          No products available right now.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} isAdmin={isAdmin} />
          ))}
        </ul>
      )}
    </div>
  );
}