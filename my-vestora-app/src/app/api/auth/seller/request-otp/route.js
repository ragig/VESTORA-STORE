import { NextResponse } from "next/server";
import { createUser, duplicateError, findUserByEmail } from "../../../../../lib/db";

export async function POST(request) {
  try {
    const { name, email } = await request.json();
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser && existingUser.role !== "SELLER") return NextResponse.json({ error: "That email is already registered" }, { status: 409 });
    if (!existingUser && !name?.trim()) return NextResponse.json({ error: "Your name is required to register" }, { status: 400 });
    const seller = existingUser || await createUser({ name: name.trim(), email: normalizedEmail, role: "SELLER" });
    return NextResponse.json({ message: "Seller account is ready. You can now log in with your email.", seller }, { status: existingUser ? 200 : 201 });
  } catch (error) {
    if (duplicateError(error)) return NextResponse.json({ error: "That email is already registered" }, { status: 409 });
    return NextResponse.json({ error: "Unable to register seller" }, { status: 500 });
  }
}
