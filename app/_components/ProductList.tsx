import db from "../lib/db";
import { auth } from "../api/[...nextauth]/route";
// import { ROLES } from "../lib/roles";
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
  // const isAdmin = session?.user?.role === ROLES.ADMIN;

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Products</h2>
        { <AddProductModal />}
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          No products available right now.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      )}
    </div>
  );
}