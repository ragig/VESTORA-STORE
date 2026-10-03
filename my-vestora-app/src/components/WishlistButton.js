"use client";

import { useState } from "react";

export default function WishlistButton({ productId, initialSaved = false, onChange }) {
  const [saved, setSaved] = useState(initialSaved);
  const [message, setMessage] = useState("");
  async function toggle() {
    setMessage("");
    const response = await fetch(`/api/customer/wishlist${saved ? `?productId=${productId}` : ""}`, { method: saved ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: saved ? undefined : JSON.stringify({ productId }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Sign in as a customer to save items."); return; }
    setSaved(data.saved); onChange?.(data.saved);
  }
  return <span className="wishlist-control"><button aria-label={saved ? "Remove from wishlist" : "Add to wishlist"} className={`wishlist-button${saved ? " saved" : ""}`} onClick={toggle} type="button">{saved ? "♥" : "♡"}</button>{message && <small>{message}</small>}</span>;
}
