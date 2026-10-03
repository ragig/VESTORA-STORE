import { NextResponse } from "next/server";

export async function POST(request) { const body = await request.json(); return NextResponse.json({ message: "Checkout provider ready", email: body.email, paymentRequired: true }); }
