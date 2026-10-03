"use client";

import Link from "next/link";
import { useCartStore } from "../store/cartStore";
import { formatINR } from "../lib/currency";

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity } = useCartStore();
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  if (!isOpen) return null;
  return <><button className="drawer-backdrop" aria-label="Close cart" onClick={closeCart} /><aside className="cart-drawer"><div className="drawer-head"><h2>Your bag</h2><button onClick={closeCart}>Close</button></div>{items.length ? <><div className="cart-items">{items.map((item) => <div className="cart-item" key={`${item.id}-${item.selectedSize || "default"}`}><img src={item.image} alt="" /><div><h3>{item.name}</h3><p>{item.selectedSize ? `Size: ${item.selectedSize} · ` : ""}{formatINR(item.price)}</p><div className="quantity"><button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)}>+</button></div></div><button className="remove" onClick={() => updateQuantity(item.id, 0, item.selectedSize)}>×</button></div>)}</div><div className="drawer-total"><span>Subtotal</span><strong>{formatINR(total)}</strong></div><Link className="button button-dark full-width" href="/checkout" onClick={closeCart}>Checkout</Link></> : <div className="empty-state"><p>Your bag is waiting for something beautiful.</p><Link href="/products" onClick={closeCart}>Explore the collection →</Link></div>}</aside></>;
}
