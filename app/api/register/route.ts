import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@/app/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password } = body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !name.trim()) {
    return NextResponse.json({ success: false, message: "Name is required." }, { status: 400 });
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ success: false, message: "Enter a valid email address." }, { status: 400 });
  }

  if (!password || password.length < 8) {
    return NextResponse.json({ success: false, message: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    return NextResponse.json({ success: false, message: "A user with this email already exists." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await db.query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)`,
    [name.trim(), email.trim(), hashed]
  );

  return NextResponse.json(
    { success: true, message: "Registered successfully." },
    { status: 201 }
  );
}
