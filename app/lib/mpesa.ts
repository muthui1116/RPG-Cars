const MPESA_ENV = process.env.MPESA_ENV ?? "sandbox"; // "sandbox" | "production"

const BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

function formatPhoneNumber(rawPhone: string): string {
  // Accepts 07XXXXXXXX, 7XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX
  let phone = rawPhone.replace(/\s+/g, "").replace(/^\+/, "");
  if (phone.startsWith("0")) {
    phone = "254" + phone.slice(1);
  } else if (phone.startsWith("7") || phone.startsWith("1")) {
    phone = "254" + phone;
  }
  return phone; // e.g. 254712345678
}

async function getAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to get M-Pesa access token: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

function generateTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function generatePassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

type StkPushInput = {
  phone: string;
  amount: number;
  orderId: string;
};

type StkPushResult =
  | { success: true; checkoutRequestId: string }
  | { success: false; error: string };

export async function initiateStkPush({
  phone,
  amount,
  orderId,
}: StkPushInput): Promise<StkPushResult> {
  try {
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);
    const formattedPhone = formatPhoneNumber(phone);
    const shortcode = process.env.MPESA_SHORTCODE!;

    const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount), // M-Pesa expects a whole-number KES amount
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL!,
        AccountReference: `Order-${orderId}`,
        TransactionDesc: `Payment for order ${orderId}`,
      }),
    });

    const data = await res.json();

    if (data.ResponseCode !== "0") {
      return {
        success: false,
        error: data.errorMessage ?? data.ResponseDescription ?? "STK push failed",
      };
    }

    return { success: true, checkoutRequestId: data.CheckoutRequestID };
  } catch (err) {
    console.error("initiateStkPush error:", err);
    return { success: false, error: "Could not reach M-Pesa. Try again." };
  }
}