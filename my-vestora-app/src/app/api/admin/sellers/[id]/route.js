import { NextResponse } from "next/server";
import { getSession } from "../../../../../lib/auth";
import { archiveProduct, createSellerNotice, deleteProduct, deleteSellerNotice, duplicateError, findUserById, listProducts, query, referencedError, updateSeller } from "../../../../../lib/db";
import { normalizePhoneNumber, isValidPhoneNumber } from "../../../../../lib/phone";

async function adminOnly() {
  const session = await getSession();
  return session?.user?.role === "ADMIN" ? session : null;
}

export async function PATCH(request, { params }) {
  if (!await adminOnly()) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const sellerId = Number((await params).id);
  const body = await request.json();
  const phone = normalizePhoneNumber(body.phone);
  if (!body.name?.trim() || !isValidPhoneNumber(phone)) return NextResponse.json({ error: "A valid name and phone number are required" }, { status: 400 });
  try {
    const seller = await updateSeller(sellerId, { name: body.name.trim(), phone });
    if (!seller) return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    return NextResponse.json(seller);
  } catch (error) {
    if (duplicateError(error)) return NextResponse.json({ error: "That phone number is already registered" }, { status: 409 });
    return NextResponse.json({ error: "Unable to update seller" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!await adminOnly()) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const sellerId = Number((await params).id);
  const noticeId = new URL(request.url).searchParams.get("noticeId");
  if (noticeId) {
    const deleted = await deleteSellerNotice(Number(noticeId), sellerId);
    if (!deleted) return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    return NextResponse.json({ deleted: true });
  }
  try {
    const seller = await findUserById(sellerId);
    if (seller?.role !== "SELLER") return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    const products = await listProducts({ sellerId });
    for (const product of products) {
      try {
        await deleteProduct(product.id);
      } catch (error) {
        if (!referencedError(error)) throw error;
        await archiveProduct(product.id);
      }
    }
    await query("DELETE FROM `User` WHERE id = ? AND role = 'SELLER'", [sellerId]);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to delete seller" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  if (!await adminOnly()) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const sellerId = Number((await params).id);
  const { message } = await request.json();
  if (!message?.trim()) return NextResponse.json({ error: "Notice message is required" }, { status: 400 });
  try { const notice = await createSellerNotice(sellerId, message.trim()); return NextResponse.json(notice, { status: 201 }); } catch { return NextResponse.json({ error: "Unable to send notice" }, { status: 500 }); }
}

