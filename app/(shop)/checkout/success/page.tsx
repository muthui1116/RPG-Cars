type SuccessPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { orderId } = await searchParams;

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-3">
      <h1 className="text-2xl font-bold text-gray-900">Payment successful</h1>
      <p className="text-gray-600">
        Thanks for your order. Your M-Pesa payment has been confirmed.
      </p>
      {orderId && (
        <p className="text-gray-600">
          Order ID: <span className="font-mono font-medium">{orderId}</span>
        </p>
      )}
    </div>
  );
}