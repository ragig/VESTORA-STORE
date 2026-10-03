"use client";

export default function DeleteProductButton({ productId }) {
  async function remove() {
    if (!window.confirm("Remove this product?")) return;
    const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    if (response.ok) window.location.reload();
  }
  return <button className="text-button" onClick={remove} type="button">Remove</button>;
}
