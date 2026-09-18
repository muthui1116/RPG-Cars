import { redirect } from "next/navigation";
import { auth } from "../api/[...nextauth]/route";

const ADMIN_ROLE = 1; // adjust if your convention differs

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/admin");
  }

  if (session.user.role !== ADMIN_ROLE) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">Admin</h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}