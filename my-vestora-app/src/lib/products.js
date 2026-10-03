export const demoProducts = [
  { id: 1, name: "Luna Ceramic Set", slug: "luna-ceramic-set", description: "Hand-finished ceramic vessels for slow mornings and warm spaces.", price: 68, shippingCharge: 0, image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85", category: "Home", featured: true, stock: 18 },
  { id: 2, name: "Sol Linen Throw", slug: "sol-linen-throw", description: "A softly textured linen throw woven for effortless comfort.", price: 94, shippingCharge: 0, image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85", category: "Textiles", featured: true, stock: 12 },
  { id: 3, name: "Forma Leather Tote", slug: "forma-leather-tote", description: "An everyday leather tote with considered details and generous space.", price: 185, shippingCharge: 0, image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85", category: "Accessories", featured: true, stock: 8 },
  { id: 4, name: "Onda Glass Carafe", slug: "onda-glass-carafe", description: "Sculptural hand-blown glassware designed for the table.", price: 76, shippingCharge: 0, image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=900&q=85", category: "Home", featured: false, stock: 20 },
  { id: 5, name: "Mara Wool Cushion", slug: "mara-wool-cushion", description: "A tactile wool cushion that brings a quiet layer of color.", price: 58, shippingCharge: 0, image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85", category: "Textiles", featured: false, stock: 14 },
  { id: 6, name: "Atelier Desk Lamp", slug: "atelier-desk-lamp", description: "A timeless desk lamp with a warm, focused glow.", price: 142, shippingCharge: 0, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85", category: "Objects", featured: false, stock: 6 },
];

export async function getProducts() {
  try {
    const { listProducts } = await import("./db");
    const products = await listProducts({ published: true });
    return products.length ? products : demoProducts;
  } catch { return demoProducts; }
}

export async function getProduct(id) {
  const products = await getProducts();
  return products.find((product) => String(product.id) === String(id) || product.slug === id);
}
