export default function LockedPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900">Temporarily locked</h1>
        <p className="mt-3 text-gray-600">
          Too many requests were detected. Please try again in a few minutes.
        </p>
      </div>
    </main>
  );
}