"use client";

import { useEffect, useRef, useState } from "react";
import { formatINR } from "../../lib/currency";

const emptyEdit = { name: "", price: "", stock: "", category: "", description: "", image: "", sizes: [] };

export default function SellerProducts({ initialProducts = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [message, setMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSizes, setNewSizes] = useState([]);
  const addFormRef = useRef(null);

  useEffect(() => {
    function openAddForm() {
      setShowAddForm(true);
      window.setTimeout(() => addFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    }

    window.addEventListener("seller:add-product", openAddForm);
    return () => window.removeEventListener("seller:add-product", openAddForm);
  }, []);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");
    const formData = new FormData(form);
    formData.set("sizes", JSON.stringify(newSizes));
    const response = await fetch("/api/products", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Unable to add product"); return; }
    setProducts((currentProducts) => [{ ...data, price: Number(data.price) }, ...currentProducts]);
    form.reset();
    setNewSizes([]);
    setShowAddForm(false);
    setMessage("Product published.");
  }

  function startEditing(product) {
    setEditingId(product.id);
    setEditForm({ name: product.name || "", price: product.price, stock: product.stock, category: product.category || "", description: product.description || "", image: product.image || "", sizes: product.sizes || [] });
    setMessage("");
  }

  async function saveEdit(event) {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`/api/products/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...editForm, price: Number(editForm.price), stock: Number(editForm.stock), sizes: editForm.sizes }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Unable to update product"); return; }
    setProducts((currentProducts) => currentProducts.map((product) => product.id === data.id ? { ...data, price: Number(data.price) } : product));
    setEditingId(null);
    setMessage("Product details updated.");
  }

  async function remove(id) {
    if (!window.confirm("Remove this product?")) return;
    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (response.ok) { setProducts((currentProducts) => currentProducts.filter((product) => product.id !== id)); setMessage("Product removed."); }
  }

  function updateField(field, value) { setEditForm((current) => ({ ...current, [field]: value })); }
  function updateSize(setter, index, field, value) { setter((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)); }
  function sizeFields(sizes, setter) {
    return <div className="size-inventory"><span className="size-inventory-heading">Size inventory (optional)</span>{sizes.map((item, index) => <div className="size-inventory-row" key={`${index}-${item.size}`}><input aria-label={`Size ${index + 1}`} placeholder="Size (e.g. M)" required value={item.size} onChange={(event) => updateSize(setter, index, "size", event.target.value)} /><input aria-label={`Stock for size ${index + 1}`} min="0" placeholder="Stock" required type="number" value={item.stock} onChange={(event) => updateSize(setter, index, "stock", event.target.value)} /><button className="text-button" onClick={() => setter((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button">Remove</button></div>)}<button className="text-button" onClick={() => setter((current) => [...current, { size: "", stock: "" }])} type="button">+ Add size</button>{sizes.length > 0 && <small>Overall stock is calculated from the size stock numbers.</small>}</div>;
  }

  return <>
    {showAddForm && <form className="checkout-form seller-add-product-form" ref={addFormRef} onSubmit={submit}><h2>Add a product</h2><label>Product name<input name="name" required /></label><label>Your price (₹)<input min="0.01" name="price" required step="0.01" type="number" /></label>{newSizes.length === 0 && <label>Stock<input min="0" name="stock" required type="number" /></label>}{sizeFields(newSizes, setNewSizes)}<label>Category<input defaultValue="Objects" name="category" /></label><label>Product picture<input accept="image/*" name="image" required type="file" /></label><label>Description<textarea className="seller-description-input" name="description" /></label>{message && <p className="login-note">{message}</p>}<div><button className="button button-dark" type="submit">Publish product <span>↗</span></button><button className="text-button" onClick={() => setShowAddForm(false)} type="button">Cancel</button></div></form>}
    {!showAddForm && message && <p className="login-note">{message}</p>}
    <div className="admin-table seller-products-table"><div className="table-head"><span>Product</span><span>Price</span><span>Stock</span><span>Action</span></div>{products.map((product) => editingId === product.id ? <form className="product-edit-row" key={product.id} onSubmit={saveEdit}><label>Name<input required value={editForm.name} onChange={(event) => updateField("name", event.target.value)} /></label><label>Price<input min="0.01" required step="0.01" type="number" value={editForm.price} onChange={(event) => updateField("price", event.target.value)} /></label>{editForm.sizes.length === 0 && <label>Stock<input min="0" required type="number" value={editForm.stock} onChange={(event) => updateField("stock", event.target.value)} /></label>}{sizeFields(editForm.sizes, (value) => updateField("sizes", typeof value === "function" ? value(editForm.sizes) : value))}<label>Category<input value={editForm.category} onChange={(event) => updateField("category", event.target.value)} /></label><label>Image URL<input value={editForm.image} onChange={(event) => updateField("image", event.target.value)} /></label><label>Description<textarea value={editForm.description} onChange={(event) => updateField("description", event.target.value)} /></label><div><button className="button button-dark" type="submit">Save</button><button className="text-button" onClick={() => setEditingId(null)} type="button">Cancel</button></div></form> : <div className="seller-product-admin-row" key={product.id}><span>{product.name}<small>{product.category}{product.sizes?.length ? ` · ${product.sizes.map((item) => `${item.size}: ${item.stock}`).join(", ")}` : ""}</small></span><span>{formatINR(product.price)}</span><span>{product.stock}</span><span><button className="text-button" onClick={() => startEditing(product)} type="button">Edit</button><button className="text-button danger-text-button" onClick={() => remove(product.id)} type="button">Remove</button></span></div>)}</div>
  </>;
}
