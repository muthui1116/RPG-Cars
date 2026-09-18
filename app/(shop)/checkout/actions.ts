"use server";

import { auth } from "../../api/[...nextauth]/route";
import db from "../../lib/db";
import { initiateStkPush } from "../../lib/mpesa";

type CheckoutItem = {
  id: string;
  quantity: number;
  price: number;
};

type PlaceOrderInput = {
  customer: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  items: CheckoutItem[];
  totalPrice: number;
};

type PlaceOrderResult =
  | { success: true; orderId: string; checkoutRequestId: string }
  | { success: false; error: string };

export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  // --- enforce sign-in server-side, regardless of what the client sent ---
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be signed in to place an order." };
  }

  const { customer, items, totalPrice } = input;

  if (items.length === 0) {
    return { success: false, error: "Cart is empty." };
  }

  let orderId: string;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO orders
         (customer_name, customer_email, address, city, postal_code, phone, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id`,
      [
        customer.fullName,
        customer.email,
        customer.address,
        customer.city,
        customer.postalCode,
        customer.phone,
        totalPrice,
      ]
    );

    orderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("placeOrder failed (transaction):", err);
    return { success: false, error: "Failed to place order. Please try again." };
  } finally {
    client.release();
  }

  try {
    const stkResult = await initiateStkPush({
      phone: customer.phone,
      amount: totalPrice,
      orderId,
    });

    if (!stkResult.success) {
      await db.query(
        `UPDATE orders SET payment_status = 'failed' WHERE id = $1`,
        [orderId]
      );
      return { success: false, error: stkResult.error };
    }

    await db.query(
      `UPDATE orders SET mpesa_checkout_request_id = $1 WHERE id = $2`,
      [stkResult.checkoutRequestId, orderId]
    );

    return {
      success: true,
      orderId,
      checkoutRequestId: stkResult.checkoutRequestId,
    };
  } catch (err) {
    console.error("STK push failed:", err);
    return {
      success: false,
      error: "Could not initiate M-Pesa payment. Please try again.",
    };
  }
}

export async function getOrderPaymentStatus(orderId: string) {
  const session = await auth();
  if (!session?.user) {
    return "unauthorized";
  }

  // only let a user check the status of their own order
  const result = await db.query(
    `SELECT payment_status FROM orders WHERE id = $1 AND customer_email = $2`,
    [orderId, session.user.email]
  );
  return result.rows[0]?.payment_status ?? "pending";
}