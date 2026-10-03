import { NextResponse } from "next/server";
import { getProduct } from "../../../../lib/products";
import { archiveProduct, deleteProduct, findProductById, referencedError, updateProduct } from "../../../../lib/db";
import { getSession } from "../../../../lib/auth";

export async function GET(request, { params }) { const { id } = await params; const product = await getProduct(id); return product ? NextResponse.json(product) : NextResponse.json({ error: "Product not found" }, { status: 404 }); }
export async function DELETE(request, { params }) {
	const session = await getSession(); const { id } = await params;
	if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Access denied" }, { status: 403 });
	const product = await findProductById(Number(id));
	if (!product || (session.user.role === "SELLER" && product.sellerId !== Number(session.user.id))) return NextResponse.json({ error: "Product not found" }, { status: 404 });
	try { await deleteProduct(Number(id)); return NextResponse.json({ success: true, removed: true }); } catch (error) { if (referencedError(error)) { await archiveProduct(Number(id)); return NextResponse.json({ success: true, removed: false, archived: true }); } throw error; }
}

export async function PATCH(request, { params }) {
	const session = await getSession(); const { id } = await params;
	if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Access denied" }, { status: 403 });
	const existing = await findProductById(Number(id));
	if (!existing || (session.user.role === "SELLER" && existing.sellerId !== Number(session.user.id))) return NextResponse.json({ error: "Product not found" }, { status: 404 });
	const body = await request.json(); const price = Number(body.price); const shippingCharge = Number(body.shippingCharge || 0);
	const sizes = Array.isArray(body.sizes) ? body.sizes.map((item) => ({ size: String(item.size || "").trim(), stock: Number(item.stock) })) : [];
	const stock = sizes.length ? sizes.reduce((total, item) => total + item.stock, 0) : Number(body.stock);
	if (sizes.some((item) => !item.size || !Number.isInteger(item.stock) || item.stock < 0) || new Set(sizes.map((item) => item.size.toLowerCase())).size !== sizes.length || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 || !Number.isFinite(shippingCharge) || shippingCharge < 0) return NextResponse.json({ error: "Invalid size inventory, price, stock, or shipping charge" }, { status: 400 });
	const product = await updateProduct(existing.id, { name: body.name?.trim() || existing.name, price, shippingCharge, stock, sizes, description: body.description ?? existing.description, image: body.image ?? existing.image, category: body.category ?? existing.category });
	return NextResponse.json(product);
}
