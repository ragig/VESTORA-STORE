"use client";

import Link from "next/link";
import { useCartStore } from "../store/cartStore";
import { formatINR } from "../lib/currency";
import WishlistButton from "./WishlistButton";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductCard({ product }) {
  const addItem = useCartStore((state) => state.addItem);
  const buyNow = useCartStore((state) => state.buyNow);
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState(product.sizes?.find((item) => item.stock > 0)?.size || "");
  const selectedStock = product.sizes?.find((item) => item.size === selectedSize)?.stock;
  const item = { ...product, selectedSize };
  return <article className="product-card"><Link href={`/products/${product.id}`} className="product-image"><img src={product.image} alt={product.name} /><span>{product.category}</span></Link><div className="product-info"><div><Link href={`/products/${product.id}`}><h3>{product.name}</h3></Link><p>{product.description}</p></div>{product.sizes?.length > 0 && <label className="size-selector">Size<select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}><option value="">Choose size</option>{product.sizes.map((size) => <option disabled={size.stock < 1} key={size.size} value={size.size}>{size.size}{size.stock < 1 ? " (sold out)" : ""}</option>)}</select>{selectedSize && <small>{selectedStock} available</small>}</label>}<div className="product-bottom"><strong>{formatINR(product.price)}</strong><WishlistButton productId={product.id} /><button disabled={product.sizes?.length > 0 && !selectedSize} onClick={() => addItem(item)}>Add</button><button disabled={product.sizes?.length > 0 && !selectedSize} onClick={() => { buyNow(item); router.push("/checkout"); }} type="button">Buy now</button></div></div></article>;
}
