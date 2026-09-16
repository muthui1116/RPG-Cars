// app/products/page.tsx (or wherever ProductsPage lives)
import ProductsList from "./ProductList";

export default async function ProductsPage({ category }: { category?: string }) {
  // No auth required — anyone (logged in or not) can view products.
  // ProductsList itself checks the session to decide if admin controls show.
  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <ProductsList category={category} />
    </div>
  );
}