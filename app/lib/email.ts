import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

type OrderStatus = "pending" | "paid" | "cancelled" | "delivered";

const STATUS_COPY: Record<OrderStatus, { subject: string; message: string }> = {
  pending: {
    subject: "Your order is pending",
    message: "We're processing your order.",
  },
  paid: {
    subject: "Payment received ✅",
    message: "We've received your payment and are preparing your order.",
  },
  cancelled: {
    subject: "Your order was cancelled",
    message: "Your order has been cancelled. If this is unexpected, please contact us.",
  },
  delivered: {
    subject: "Your order has been delivered 📦",
    message: "Your order has been delivered. Thanks for shopping with us!",
  },
};

export async function sendOrderStatusEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  status: OrderStatus;
}) {
  const { to, customerName, orderId, status } = params;
  const copy = STATUS_COPY[status];

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"Your Shop" <no-reply@yourshop.com>`,
      to,
      subject: copy.subject,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #111;">${copy.subject}</h2>
          <p>Hi ${customerName},</p>
          <p>${copy.message}</p>
          <p style="color: #666; font-size: 14px;">Order ID: <strong>${orderId}</strong></p>
        </div>
      `,
    });
  } catch (err) {
    // Log but don't throw — a failed email shouldn't roll back the status update
    console.error("Failed to send order status email:", err);
  }
}