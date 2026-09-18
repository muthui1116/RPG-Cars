import db from "../../lib/db";
import OrderStatusSelect from "./OrderStatusSelect";

export default async function AdminOrdersPage() {
  const result = await db.query(
    `SELECT id, customer_name, customer_email, phone, total_price, status,
            payment_status, created_at
     FROM orders
     ORDER BY created_at DESC
     LIMIT 100`
  );

  const orders = result.rows;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Orders</h2>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {order.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{order.customer_name}</div>
                  <div className="text-xs text-gray-500">{order.customer_email}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">{order.phone}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  ${Number(order.total_price).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.payment_status === "paid"
                        ? "bg-green-100 text-green-700"
                        : order.payment_status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.payment_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}