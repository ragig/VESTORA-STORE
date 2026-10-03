"use client";

import { useEffect, useState } from "react";
import { formatINR } from "../../../lib/currency";

export default function SellerManagement() {
  const [sellers, setSellers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/sellers", { cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!active) return;
        if (response.ok) setSellers(data);
        else setError(data.error || "Unable to load sellers");
      })
      .catch(() => { if (active) setError("Unable to load sellers"); });
    return () => { active = false; };
  }, []);

  function selectSeller(seller) {
    setSelectedId(String(seller.id));
    setForm({ name: seller.name || "", phone: seller.phone || "", message: "" });
    setError("");
    setMessage("");
  }

  async function updateSeller(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/sellers/${selectedId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, phone: form.phone }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Unable to update seller"); return; }
    setSellers((items) => items.map((item) => item.id === data.id ? { ...item, ...data } : item));
    setMessage("Seller details updated.");
  }

  async function sendNotice(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/sellers/${selectedId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: form.message }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Unable to send notice"); return; }
    setForm((current) => ({ ...current, message: "" }));
    setMessage("Notice sent to seller.");
  }

  async function removeProduct(productId) {
    if (!window.confirm("Remove this seller product?")) return;
    setError("");
    setMessage("");
    const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Unable to delete product"); return; }
    setSellers((items) => items.map((item) => String(item.id) === selectedId ? { ...item, products: item.products.filter((product) => product.id !== productId) } : item));
    setMessage("Product removed.");
  }

  async function removeSeller() {
    if (!window.confirm("Delete this seller account? Their products will be removed or hidden if order history needs them.")) return;
    const response = await fetch(`/api/admin/sellers/${selectedId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Unable to delete seller"); return; }
    const remaining = sellers.filter((item) => item.id !== Number(selectedId));
    setSellers(remaining);
    if (remaining[0]) selectSeller(remaining[0]);
    else {
      setSelectedId("");
      setForm({ name: "", phone: "", message: "" });
    }
    setMessage("Seller deleted.");
  }

  const seller = sellers.find((item) => String(item.id) === selectedId);

  return <div className="seller-management"><label className="seller-select-label">Select seller<select value={selectedId} onChange={(event) => { const item = sellers.find((sellerItem) => String(sellerItem.id) === event.target.value); if (item) selectSeller(item); }}><option value="">Choose a seller</option>{sellers.map((item) => <option key={item.id} value={item.id}>{item.name || "Unnamed seller"}</option>)}</select></label>{seller && <><div className="seller-management-grid"><form className="checkout-form" onSubmit={updateSeller}><p className="eyebrow">Seller profile</p><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Phone number<input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><button className="button button-dark" type="submit">Save changes <span>-&gt;</span></button></form><form className="checkout-form" onSubmit={sendNotice}><p className="eyebrow">Send a notice</p><label>Message<textarea required value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Write an update for this seller" /></label><button className="button button-dark" type="submit">Send notice <span>-&gt;</span></button></form></div><div className="admin-table seller-management-products"><div className="table-head"><span>Product</span><span>Price</span><span>Category</span><span>Action</span></div>{seller.products.length ? seller.products.map((product) => <div key={product.id}><span>{product.name}</span><span>{formatINR(product.price)}</span><span>{product.category || "Unassigned"}</span><span><button className="text-button danger-text-button" onClick={() => removeProduct(product.id)} type="button">Remove</button></span></div>) : <p className="empty-state">No products assigned.</p>}</div><button className="danger-button" onClick={removeSeller} type="button">Delete seller account</button></>}{error && <p className="login-error">{error}</p>}{message && <p className="login-note">{message}</p>}</div>;
}
