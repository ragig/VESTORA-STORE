"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatINR } from "../lib/currency";

const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const trackingSteps = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getExpectedDeliveryDate(createdAt) {
  const expected = new Date(createdAt);
  expected.setDate(expected.getDate() + 5);
  return expected;
}

function getStatusLabel(status) {
  if (status === "PENDING") return "Confirmed";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function OrderList({ role, sellerId }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const query = sellerId ? `?sellerId=${sellerId}` : "";
        const response = await fetch(`/api/orders${query}`, { cache: "no-store" });
        const data = await response.json();
        if (!active) return;
        if (!response.ok) setError(data.error || "Unable to load orders");
        else {
          setOrders(data);
          setError("");
        }
      } catch {
        if (active) setError("Unable to load orders");
      }
    }

    loadOrders();
    const refresh = window.setInterval(loadOrders, 5000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, [sellerId]);

  async function updateStatus(orderId, itemId, status) {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, status }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to update status");
      return;
    }
    setOrders((currentOrders) => currentOrders.map((order) => (order.id === data.id ? data : order)));
  }

  async function cancelOrder(orderId) {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancellingOrderId(orderId);
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to cancel order");
        return;
      }
      setOrders((currentOrders) => currentOrders.map((order) => (order.id === data.id ? { ...order, ...data } : order)));
    } catch {
      setError("Unable to cancel order");
    } finally {
      setCancellingOrderId(null);
    }
  }

  if (error) return <p className="login-error">{error}</p>;
  if (!orders.length) return <p className="login-note">No orders yet.</p>;

  return (
    <div className="order-list">
      {orders.map((order) => {
        const expectedDelivery = getExpectedDeliveryDate(order.createdAt);
        const visibleItems = order.items.filter((item) => role !== "SELLER" || item.product?.sellerId);

        return (
          <article className="order-card" key={order.id}>
            <div className="order-card-head">
              <strong>Order #{order.id}</strong>
              <span>{formatDate(order.createdAt)}</span>
              <span className="expected-delivery">Expected delivery: {formatDate(expectedDelivery)}</span>
              <b>{order.status}</b>
            </div>

            {role === "CUSTOMER" && (
              <div className={`order-tracker${order.status === "CANCELLED" ? " cancelled" : ""}`} aria-label={`Order status: ${order.status}`}>
                {order.status === "CANCELLED" ? (
                  <strong>Order cancelled</strong>
                ) : (
                  trackingSteps.map((step, index) => {
                    const isComplete = trackingSteps.indexOf(order.status) >= index;
                    const isCurrent = order.status === step;
                    return (
                      <div className={`tracking-step${isComplete ? " complete" : ""}${isCurrent ? " current" : ""}`} key={step}>
                        <span>{isComplete ? "\u2713" : index + 1}</span>
                        <small>{getStatusLabel(step)}</small>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="order-customer">
              {order.customerName && <span>{order.customerName}</span>}
              <span>{order.customerEmail}</span>
              {order.shippingAddress && <span>{order.shippingAddress}, {order.shippingCity} {order.shippingPostalCode}</span>}
              <span>Payment: {order.paymentMethod === "ONLINE" ? "Online" : "Cash on delivery"}</span>
            </div>

            {visibleItems.map((item) => (
              <div className="order-item-row" key={item.id}>
                <span className="order-product">
                  {item.product?.image && <img src={item.product.image} alt={item.product?.name || "Product"} />}
                  <span>
                    <strong>{item.product?.name || "Product"}</strong>
                    <small>Quantity: {item.quantity}</small>
                  </span>
                </span>
                <span>{formatINR(Number(item.price) * item.quantity)}</span>
                <span className={`order-status status-${item.status.toLowerCase()}`}>
                  <span>{item.status !== "CANCELLED" ? "\u2713" : "!"}</span>
                  {getStatusLabel(item.status)}
                </span>
                {role === "CUSTOMER" && item.status !== "CANCELLED" && <Link className="text-button review-order-link" href={`/products/${item.productId}#reviews`}>Review</Link>}
                {role !== "CUSTOMER" && (
                  <select value={item.status} onChange={(event) => updateStatus(order.id, item.id, event.target.value)}>
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                )}
              </div>
            ))}

            <div className="order-total">
              <strong>Total</strong>
              <strong>{formatINR(order.total)}</strong>
            </div>

            {role === "CUSTOMER" && order.status !== "CANCELLED" && !["SHIPPED", "DELIVERED"].includes(order.status) && !order.items.some((item) => ["SHIPPED", "DELIVERED"].includes(item.status)) && (
              <button className="danger-button" disabled={cancellingOrderId === order.id} onClick={() => cancelOrder(order.id)} type="button">
                {cancellingOrderId === order.id ? "Cancelling…" : "Cancel order"}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
