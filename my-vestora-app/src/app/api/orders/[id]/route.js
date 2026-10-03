import { NextResponse } from "next/server";
import { cancelOrder, findOrderWithItems, updateOrderItemsStatus } from "../../../../lib/db";
import { getSession } from "../../../../lib/auth";

const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session?.user || !["CUSTOMER", "SELLER", "ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Login required" }, { status: 403 });
  const { id } = await params; const body = await request.json(); const status = String(body.status || "").toUpperCase();
  if (!statuses.includes(status)) return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
  const order = await findOrderWithItems(Number(id));
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (session.user.role === "CUSTOMER") {
    if (order.userId !== Number(session.user.id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (status !== "CANCELLED") return NextResponse.json({ error: "Customers can only cancel orders" }, { status: 403 });
    if (order.items.some((item) => ["SHIPPED", "DELIVERED"].includes(item.status)) || ["SHIPPED", "DELIVERED"].includes(order.status)) return NextResponse.json({ error: "This order has shipped and cannot be cancelled" }, { status: 409 });
    const updated = await cancelOrder(order);
    return NextResponse.json({ ...updated, total: Number(updated.total), items: updated.items.map((item) => ({ ...item, price: Number(item.price), shippingCharge: Number(item.shippingCharge || 0) })) });
  }
  const ownedItems = session.user.role === "ADMIN" ? order.items : order.items.filter((item) => item.product.sellerId === Number(session.user.id));
  if (!ownedItems.length) return NextResponse.json({ error: "You cannot update this order" }, { status: 403 });
  const itemId = body.itemId ? Number(body.itemId) : null;
  if (itemId && !ownedItems.some((item) => item.id === itemId)) return NextResponse.json({ error: "You cannot update this product order" }, { status: 403 });
  const updated = await updateOrderItemsStatus(order, ownedItems.map((item) => item.id), status, itemId);
  return NextResponse.json({ ...updated, total: Number(updated.total), items: updated.items.map((item) => ({ ...item, price: Number(item.price), shippingCharge: Number(item.shippingCharge || 0) })) });
}
