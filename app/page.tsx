import ProductsList from "./_components/ProductList";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <ProductsList category={category} />
    </div>
  );
}
