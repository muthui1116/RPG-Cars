"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../api/[...nextauth]/route";
import db from "../../lib/db";
import { sendOrderStatusEmail } from "../../lib/email";

const ADMIN_ROLE = 1;

type OrderStatus = "pending" | "paid" | "cancelled" | "delivered";
type UpdateResult = { success: true } | { success: false; error: string };

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<UpdateResult> {
  const session = await auth();

  if (!session?.user || session.user.role !== ADMIN_ROLE) {
    return { success: false, error: "Not authorized." };
  }

  const validStatuses: OrderStatus[] = ["pending", "paid", "cancelled", "delivered"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Invalid status." };
  }

  try {
    const result = await db.query(
      `UPDATE orders SET status = $1, updated_at = now()
       WHERE id = $2
       RETURNING customer_name, customer_email`,
      [status, orderId]
    );

    const order = result.rows[0];
    if (!order) {
      return { success: false, error: "Order not found." };
    }

    sendOrderStatusEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      orderId,
      status,
    });

    revalidatePath("/admin/orders");

    return { success: true };
  } catch (err) {
    console.error("updateOrderStatus failed:", err);
    return { success: false, error: "Failed to update order status." };
  }
}