"use client";

import { useState } from "react";
import { formatINR } from "../../lib/currency";

export default function SellerDirectory({ sellers }) {
  const [selectedId, setSelectedId] = useState(sellers[0]?.id ? String(sellers[0].id) : "");
  const [sellerList, setSellerList] = useState(sellers);
  const [notice, setNotice] = useState("");
  const [noticeState, setNoticeState] = useState("");
  const seller = sellerList.find((item) => String(item.id) === selectedId);

  async function sendNotice(event) {
    event.preventDefault();
    setNoticeState("");
    const response = await fetch(`/api/admin/sellers/${selectedId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: notice }) });
    const data = await response.json();
    if (!response.ok) { setNoticeState(data.error || "Unable to send notice"); return; }
    setNotice("");
    setNoticeState("Notice sent to seller.");
  }

  async function deleteNotice(noticeId) {
    const response = await fetch(`/api/admin/sellers/${seller.id}?noticeId=${noticeId}`, { method: "DELETE" });
    if (response.ok) setSellerList((items) => items.map((entry) => entry.id === seller.id ? { ...entry, notices: entry.notices.filter((item) => item.id !== noticeId) } : entry));
  }

  async function removeProduct(productId) {
    if (!window.confirm("Remove this seller product?")) return;
    const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    if (response.ok) setSellerList((items) => items.map((entry) => entry.id === seller.id ? { ...entry, products: entry.products.filter((product) => product.id !== productId) } : entry));
  }

  async function removeSeller() {
    if (!window.confirm("Delete this seller account? Their products will be removed or hidden if order history needs them.")) return;
    const response = await fetch(`/api/admin/sellers/${seller.id}`, { method: "DELETE" });
    if (!response.ok) { setNoticeState("Unable to delete seller."); return; }
    const remaining = sellerList.filter((entry) => entry.id !== seller.id);
    setSellerList(remaining);
    setSelectedId(remaining[0]?.id ? String(remaining[0].id) : "");
    setNoticeState("Seller removed.");
  }

  return <div className="seller-directory">
    <div className="section-heading"><div><p className="eyebrow">People behind the collection</p><h2>Seller directory</h2></div><span>{sellerList.length} seller{sellerList.length === 1 ? "" : "s"}</span></div>
    {!sellerList.length ? <p className="empty-state">No sellers have been registered yet.</p> : <>
      <label className="seller-select-label">Choose a seller<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Select seller</option>{sellerList.map((item) => <option key={item.id} value={item.id}>{item.name || "Unnamed seller"}</option>)}</select></label>
      {seller && <article className="seller-card seller-detail-card">
        <div className="seller-details-heading"><div><p className="eyebrow">Selected seller</p><h3>Seller details</h3></div><span>{seller.products.length} product{seller.products.length === 1 ? "" : "s"}</span></div>
        <div className="seller-profile-summary"><div><small>Seller name</small><strong>{seller.name || "Unnamed seller"}</strong></div><div><small>Seller EID</small><strong>{seller.eid || "Not assigned"}</strong></div><div><small>Phone number</small><strong>{seller.phone || "Not added"}</strong></div><div><small>Joined</small><strong>{seller.createdAt}</strong></div></div>
        <form className="admin-notice-form" onSubmit={sendNotice}><label>Notice for {seller.name || "seller"}<textarea required value={notice} onChange={(event) => setNotice(event.target.value)} placeholder="Write a notice for this seller" /></label><button className="button button-dark" type="submit">Send notice <span>-&gt;</span></button>{noticeState && <p className="login-note">{noticeState}</p>}</form>
        {seller.notices?.length > 0 && <div className="admin-notice-list"><p className="eyebrow">Sent notices</p>{seller.notices.map((item) => <div className="admin-notice-item" key={item.id}><span>{item.message}<small>{item.createdAt}</small></span><button className="text-button" onClick={() => deleteNotice(item.id)} type="button">Delete</button></div>)}</div>}
        {seller.products.length === 0 ? <p className="empty-state">This seller has not added any products.</p> : <div className="seller-products"><div className="seller-product-row seller-product-heading"><span>Product</span><span>Price</span><span>Category</span><span>Action</span></div>{seller.products.map((product) => <div className="seller-product-row" key={product.id}><span>{product.name}</span><span>{formatINR(product.price)}</span><span>{product.category}</span><span><button className="text-button danger-text-button" onClick={() => removeProduct(product.id)} type="button">Remove</button></span></div>)}</div>}
        <button className="danger-button" onClick={removeSeller} type="button">Delete seller account</button>
      </article>}
    </>}
  </div>;
}
