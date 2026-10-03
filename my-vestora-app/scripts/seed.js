const crypto = require("crypto");
const mysql = require("mysql2/promise");

const products = [
  { name: "Luna Ceramic Set", slug: "luna-ceramic-set", description: "Hand-finished ceramic vessels for slow mornings and warm spaces.", price: 68, image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85", category: "Home", featured: true, stock: 18 },
  { name: "Sol Linen Throw", slug: "sol-linen-throw", description: "A softly textured linen throw woven for effortless comfort.", price: 94, image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85", category: "Textiles", featured: true, stock: 12 },
  { name: "Forma Leather Tote", slug: "forma-leather-tote", description: "An everyday leather tote with considered details and generous space.", price: 185, image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85", category: "Accessories", featured: true, stock: 8 },
  { name: "Onda Glass Carafe", slug: "onda-glass-carafe", description: "Sculptural hand-blown glassware designed for the table.", price: 76, image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=900&q=85", category: "Home", featured: false, stock: 20 },
  { name: "Mara Wool Cushion", slug: "mara-wool-cushion", description: "A tactile wool cushion that brings a quiet layer of color.", price: 58, image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85", category: "Textiles", featured: false, stock: 14 },
  { name: "Atelier Desk Lamp", slug: "atelier-desk-lamp", description: "A timeless desk lamp with a warm, focused glow.", price: 142, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85", category: "Objects", featured: false, stock: 6 },
];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function databaseConfig() {
  if (process.env.DATABASE_URL) return { uri: process.env.DATABASE_URL };
  return {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "vestora",
    port: Number(process.env.DB_PORT || 3306),
  };
}

async function main() {
  const connection = await mysql.createConnection(databaseConfig());
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@vestora.local").toLowerCase();
  const customerEmail = (process.env.CUSTOMER_EMAIL || "customer@vestora.local").toLowerCase();

  await connection.execute(
    "INSERT INTO `User` (email, name, role, password) VALUES (?, 'Vestora Admin', 'ADMIN', ?) ON DUPLICATE KEY UPDATE role = 'ADMIN', password = VALUES(password)",
    [adminEmail, hashPassword(process.env.ADMIN_PASSWORD || "change-this-admin-password")],
  );
  await connection.execute(
    "INSERT INTO `User` (email, name, role, password) VALUES (?, 'Vestora Customer', 'CUSTOMER', ?) ON DUPLICATE KEY UPDATE role = 'CUSTOMER', password = VALUES(password)",
    [customerEmail, hashPassword(process.env.CUSTOMER_PASSWORD || "Customer123!")],
  );

  for (const product of products) {
    await connection.execute(
      "INSERT INTO Product (name, slug, description, price, shippingCharge, image, category, featured, stock, published) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), image = VALUES(image), category = VALUES(category), featured = VALUES(featured), stock = VALUES(stock)",
      [product.name, product.slug, product.description, product.price, product.image, product.category, product.featured ? 1 : 0, product.stock],
    );
  }

  await connection.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
