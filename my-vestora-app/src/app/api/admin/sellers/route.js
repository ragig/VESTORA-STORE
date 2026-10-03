import { NextResponse } from "next/server";
import { listSellersWithProducts } from "../../../../lib/db";
import { getSession } from "../../../../lib/auth";

export async function GET() {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const sellers = await listSellersWithProducts();
  return NextResponse.json(sellers);
}

