import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const callback = body?.Body?.stkCallback;
  if (!callback) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payload" });
  }

  const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback;

  if (ResultCode === 0) {
    const items: { Name: string; Value: string | number }[] =
      CallbackMetadata?.Item ?? [];
    const receiptItem = items.find((i) => i.Name === "MpesaReceiptNumber");
    const mpesaReceiptNumber = receiptItem?.Value as string | undefined;

    await db.query(
      `UPDATE orders
       SET payment_status = 'paid', status = 'paid', mpesa_receipt_number = $1
       WHERE mpesa_checkout_request_id = $2`,
      [mpesaReceiptNumber ?? null, CheckoutRequestID]
    );
  } else {
    // user cancelled, entered wrong PIN, timed out, etc.
    await db.query(
      `UPDATE orders SET payment_status = 'failed', status = 'failed'
       WHERE mpesa_checkout_request_id = $1`,
      [CheckoutRequestID]
    );
    // TODO: restore stock_quantity for this order's items here
  }

  // Safaricom just wants a 200 with this shape acknowledging receipt
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}