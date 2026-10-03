import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { findUserById, updateUserProfile } from "../../../../lib/db";

export async function GET() {
  const session = await getSession();
  if (session?.user?.role !== "CUSTOMER") return NextResponse.json({ error: "Customer access required" }, { status: 403 });
  const customer = await findUserById(Number(session.user.id));
  return customer ? NextResponse.json(customer) : NextResponse.json({ error: "Customer not found" }, { status: 404 });
}

export async function PATCH(request) {
  const session = await getSession();
  if (session?.user?.role !== "CUSTOMER") return NextResponse.json({ error: "Customer access required" }, { status: 403 });
  const body = await request.json();
  const data = {
    name: body.name?.trim() || null,
    address: body.address?.trim() || null,
    city: body.city?.trim() || null,
    state: body.state?.trim() || null,
    postalCode: body.postalCode?.trim() || null,
    country: body.country?.trim() || null,
  };
  const customer = await updateUserProfile(Number(session.user.id), data);
  return NextResponse.json(customer);
}
