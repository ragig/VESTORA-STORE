import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getProducts } from "../../../lib/products";
import { createProduct, listProducts } from "../../../lib/db";
import { getSession } from "../../../lib/auth";

export async function GET(request) {
	const session = await getSession();
	const mine = new URL(request.url).searchParams.get("mine") === "true";
	if (mine && session?.user?.role === "SELLER") {
		const products = await listProducts({ sellerId: Number(session.user.id) });
		return NextResponse.json(products);
	}
	return NextResponse.json(await getProducts());
}
export async function POST(request) {
	const session = await getSession();
	if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Seller or admin access required" }, { status: 403 });
	try {
		const contentType = request.headers.get("content-type") || "";
		const body = contentType.includes("multipart/form-data") ? Object.fromEntries(await request.formData()) : await request.json();
		let image = typeof body.image === "string" ? body.image : "";
		if (body.image && typeof body.image !== "string" && body.image.size > 0) {
			if (!body.image.type.startsWith("image/") || body.image.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Choose an image smaller than 5 MB" }, { status: 400 });
			const extension = body.image.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
			const filename = `${crypto.randomUUID()}.${extension}`;
			const uploadDirectory = path.join(process.cwd(), "public", "uploads");
			await mkdir(uploadDirectory, { recursive: true });
			await writeFile(path.join(uploadDirectory, filename), Buffer.from(await body.image.arrayBuffer()));
			image = `/uploads/${filename}`;
		}
		const price = Number(body.price); const shippingCharge = Number(body.shippingCharge || 0);
		let sizes = [];
		try { sizes = body.sizes ? (typeof body.sizes === "string" ? JSON.parse(body.sizes) : body.sizes) : []; } catch { return NextResponse.json({ error: "Size inventory must be valid JSON" }, { status: 400 }); }
		if (!Array.isArray(sizes) || sizes.some((item) => !item?.size?.trim() || !Number.isInteger(Number(item.stock)) || Number(item.stock) < 0)) return NextResponse.json({ error: "Each size needs a name and valid stock number" }, { status: 400 });
		sizes = sizes.map((item) => ({ size: item.size.trim(), stock: Number(item.stock) }));
		if (new Set(sizes.map((item) => item.size.toLowerCase())).size !== sizes.length) return NextResponse.json({ error: "Each size can only be added once" }, { status: 400 });
		const stock = sizes.length ? sizes.reduce((total, item) => total + item.stock, 0) : Number(body.stock);
		if (!body.name?.trim() || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 || !Number.isFinite(shippingCharge) || shippingCharge < 0) return NextResponse.json({ error: "Name, positive price, valid stock, and valid shipping charge are required" }, { status: 400 });
		const product = await createProduct({ name: body.name.trim(), slug: body.slug || `${body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, description: body.description || "", price, shippingCharge, image, category: body.category || "Objects", stock, sizes, featured: session.user.role === "ADMIN" && body.featured === "true", sellerId: session.user.role === "SELLER" ? Number(session.user.id) : null });
		return NextResponse.json(product, { status: 201 });
	} catch (error) {
		console.error("Unable to create product", error);
		return NextResponse.json({ error: process.env.NODE_ENV === "development" ? `Unable to create product: ${error.message}` : "Unable to create product" }, { status: 500 });
	}
}
