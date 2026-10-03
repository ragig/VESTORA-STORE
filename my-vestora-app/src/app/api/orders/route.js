import { NextResponse } from "next/server";
import { createOrderWithItems, groupOrderRows, listOrderRows, listProducts } from "../../../lib/db";
import { getSession } from "../../../lib/auth";

export async function POST(request) {
  try {
    const { email, name, address, city, postalCode, state, country, paymentMethod, items } = await request.json();
    const session = await getSession();
    if (session?.user?.role !== "CUSTOMER") return NextResponse.json({ error: "Please log in as a customer before placing an order." }, { status: 401 });
    if (!name?.trim() || !email || !/^\S+@\S+\.\S+$/.test(email) || !address?.trim() || !city?.trim() || !/^\d{4,10}$/.test(String(postalCode || "").trim()) || !Array.isArray(items) || !items.length) return NextResponse.json({ error: "Name, email, address, city, and a valid PIN code are required" }, { status: 400 });
     if (!["COD", "ONLINE"].includes(paymentMethod)) return NextResponse.json({ error: "Choose a payment method" }, { status: 400 });
    const normalized = items.map((item) => ({ id: Number(item.id), quantity: Number(item.quantity), selectedSize: item.selectedSize ? String(item.selectedSize).trim() : null }));
    if (normalized.some((item) => !Number.isInteger(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1)) return NextResponse.json({ error: "Invalid cart quantities" }, { status: 400 });
    const allProducts = await listProducts({ published: true });
    const wantedIds = new Set(normalized.map((item) => item.id));
    const products = allProducts.filter((product) => wantedIds.has(product.id));
    if (products.length !== new Set(normalized.map((item) => item.id)).size) return NextResponse.json({ error: "One or more products are unavailable" }, { status: 400 });
    const productById = new Map(products.map((product) => [product.id, product]));
    for (const item of normalized) {
      const product = productById.get(item.id);
      if (product.sizes?.length) {
        const size = product.sizes.find((entry) => entry.size.toLowerCase() === item.selectedSize?.toLowerCase());
        if (!size) return NextResponse.json({ error: `Choose a valid size for ${product.name}` }, { status: 400 });
        if (item.quantity > size.stock) return NextResponse.json({ error: `${product.name} does not have enough stock in size ${size.size}` }, { status: 409 });
      } else if (item.quantity > product.stock) return NextResponse.json({ error: "A product does not have enough stock" }, { status: 409 });
    }
    const total = normalized.reduce((sum, item) => sum + Number(productById.get(item.id).price) * item.quantity + Number(productById.get(item.id).shippingCharge || 0), 0);
    const order = await createOrderWithItems({ customerEmail: session.user.email.toLowerCase(), customerName: name.trim(), shippingAddress: address.trim(), shippingCity: city.trim(), shippingPostalCode: String(postalCode).trim(), shippingState: state?.trim() || null, shippingCountry: country?.trim() || "India", paymentMethod, total, userId: Number(session.user.id) }, normalized, productById);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const databaseUnavailable = ["ECONNREFUSED", "ER_BAD_DB_ERROR", "ER_NO_SUCH_TABLE", "ER_ACCESS_DENIED_ERROR"].includes(error?.code);
    return NextResponse.json({ error: databaseUnavailable ? "The store database is unavailable. Check DATABASE_URL and start MySQL." : "Unable to create order" }, { status: 500 });
  }
}

export async function GET(request) {
  const session = await getSession();
  if (!session?.user || !["CUSTOMER", "SELLER", "ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const userId = Number(session.user.id);
  const sellerId = new URL(request.url).searchParams.get("sellerId");
  const rows = await listOrderRows({ role: session.user.role, userId, sellerId: sellerId ? Number(sellerId) : null });
  const orders = groupOrderRows(rows);
  return NextResponse.json(orders.map((order) => ({ ...order, total: Number(order.total), items: order.items.filter((item) => session.user.role !== "SELLER" || item.product.sellerId === userId).map((item) => ({ ...item, price: Number(item.price), shippingCharge: Number(item.shippingCharge || 0) })) })));
}
