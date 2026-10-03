import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { addWishlistItem, findProductById, listWishlistProducts, removeWishlistItem } from "../../../../lib/db";

async function customerSession() {
  const session = await getSession();
  return session?.user?.role === "CUSTOMER" ? session : null;
}

export async function GET() {
  const session = await customerSession();
  if (!session) return NextResponse.json({ error: "Customer access required" }, { status: 403 });
  const products = await listWishlistProducts(Number(session.user.id));
  return NextResponse.json(products);
}

export async function POST(request) {
  const session = await customerSession();
  if (!session) return NextResponse.json({ error: "Customer access required" }, { status: 403 });
  const { productId } = await request.json();
  const product = await findProductById(Number(productId), true);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  await addWishlistItem(Number(session.user.id), product.id);
  return NextResponse.json({ saved: true });
}

export async function DELETE(request) {
  const session = await customerSession();
  if (!session) return NextResponse.json({ error: "Customer access required" }, { status: 403 });
  const productId = Number(new URL(request.url).searchParams.get("productId"));
  await removeWishlistItem(Number(session.user.id), productId);
  return NextResponse.json({ saved: false });
}
