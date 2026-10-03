import mysql from "mysql2/promise";

const globalForMysql = globalThis;

function databaseConfig() {
  if (process.env.DB_HOST || process.env.DB_USER || process.env.DB_PASSWORD || process.env.DB_NAME) {
    return {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "vestora",
      port: Number(process.env.DB_PORT || 3306),
    };
  }
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  return {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "vestora",
    port: Number(process.env.DB_PORT || 3306),
  };
}

const config = databaseConfig();

export const db = globalForMysql.mysqlPool || mysql.createPool(typeof config === "string" ? config : {
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
    namedPlaceholders: true,
});

if (process.env.NODE_ENV !== "production") globalForMysql.mysqlPool = db;

export async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

export async function transaction(callback) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function normalizeProduct(product) {
  if (!product) return null;
  let sizes = [];
  if (product.sizes) {
    try {
      sizes = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
    } catch {
      sizes = [];
    }
  }
  return {
    ...product,
    sizes: Array.isArray(sizes) ? sizes : [],
    featured: Boolean(product.featured),
    published: Boolean(product.published),
    price: Number(product.price),
    shippingCharge: Number(product.shippingCharge || 0),
  };
}

function normalizeOrder(order) {
  if (!order) return null;
  return { ...order, total: Number(order.total) };
}

export function duplicateError(error) {
  return error?.code === "ER_DUP_ENTRY";
}

export function referencedError(error) {
  return error?.code === "ER_ROW_IS_REFERENCED" || error?.code === "ER_ROW_IS_REFERENCED_2";
}

export async function findUserByEmail(email) {
  const rows = await query("SELECT * FROM `User` WHERE email = ? LIMIT 1", [email]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const rows = await query("SELECT * FROM `User` WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

export async function createUser(data) {
  const [result] = await db.execute(
    "INSERT INTO `User` (name, email, phone, password, role, eid, address, city, state, postalCode, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [data.name || null, data.email, data.phone || null, data.password || null, data.role || "CUSTOMER", data.eid || null, data.address || null, data.city || null, data.state || null, data.postalCode || null, data.country || null],
  );
  return findUserById(result.insertId);
}

export async function updateUserProfile(id, data) {
  await query(
    "UPDATE `User` SET name = ?, address = ?, city = ?, state = ?, postalCode = ?, country = ? WHERE id = ?",
    [data.name, data.address, data.city, data.state, data.postalCode, data.country, id],
  );
  return findUserById(id);
}

export async function updateCustomerCheckoutProfile(connection, id, data) {
  await connection.execute(
    "UPDATE `User` SET name = ?, address = ?, city = ?, postalCode = ?, state = ?, country = ? WHERE id = ?",
    [data.name, data.address, data.city, data.postalCode, data.state, data.country, id],
  );
}

export async function updateSeller(id, data) {
  await query("UPDATE `User` SET name = ?, phone = ? WHERE id = ? AND role = 'SELLER'", [data.name, data.phone, id]);
  const seller = await findUserById(id);
  return seller?.role === "SELLER" ? seller : null;
}

export async function listAdminSellers() {
  const sellers = await query("SELECT id, name, email, phone, eid, createdAt FROM `User` WHERE role = 'SELLER' ORDER BY createdAt DESC");
  const products = await query("SELECT id, name, price, category, published, sellerId FROM Product ORDER BY createdAt DESC");
  const notices = await query("SELECT id, message, createdAt, readAt, sellerId FROM SellerNotice ORDER BY createdAt DESC");
  return sellers.map((seller) => ({
    ...seller,
    products: products.filter((product) => product.sellerId === seller.id).map(normalizeProduct),
    notices: notices.filter((notice) => notice.sellerId === seller.id),
  }));
}

export async function listSellersWithProducts() {
  const sellers = await query("SELECT id, name, email, phone, eid, createdAt FROM `User` WHERE role = 'SELLER' ORDER BY name ASC");
  const products = await query("SELECT id, name, price, category, sellerId FROM Product WHERE sellerId IS NOT NULL ORDER BY name ASC");
  return sellers.map((seller) => ({
    ...seller,
    products: products.filter((product) => product.sellerId === seller.id).map(normalizeProduct),
  }));
}

export async function listProducts({ published, sellerId, includeSeller } = {}) {
  const where = [];
  const params = [];
  if (published !== undefined) {
    where.push("p.published = ?");
    params.push(published ? 1 : 0);
  }
  if (sellerId !== undefined) {
    where.push("p.sellerId = ?");
    params.push(sellerId);
  }
  const sellerSelect = includeSeller ? ", u.name AS sellerName, u.email AS sellerEmail, u.phone AS sellerPhone, u.eid AS sellerEid" : "";
  const sellerJoin = includeSeller ? " LEFT JOIN `User` u ON u.id = p.sellerId" : "";
  const rows = await query(`SELECT p.*${sellerSelect} FROM Product p${sellerJoin}${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY p.createdAt DESC`, params);
  return rows.map((row) => {
    const product = normalizeProduct(row);
    if (!includeSeller) return product;
    return {
      ...product,
      seller: row.sellerName || row.sellerEmail || row.sellerPhone || row.sellerEid ? { name: row.sellerName, email: row.sellerEmail, phone: row.sellerPhone, eid: row.sellerEid } : null,
    };
  });
}

export async function findProductById(id, publishedOnly = false) {
  const rows = await query(`SELECT * FROM Product WHERE id = ?${publishedOnly ? " AND published = 1" : ""} LIMIT 1`, [id]);
  return normalizeProduct(rows[0]);
}

export async function createProduct(data) {
  const [result] = await db.execute(
    "INSERT INTO Product (name, slug, description, price, shippingCharge, image, category, featured, stock, sizes, published, sellerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)",
    [data.name, data.slug, data.description, data.price, data.shippingCharge, data.image, data.category, data.featured ? 1 : 0, data.stock, JSON.stringify(data.sizes || []), data.sellerId],
  );
  return findProductById(result.insertId);
}

export async function updateProduct(id, data) {
  await query(
    "UPDATE Product SET name = ?, price = ?, shippingCharge = ?, stock = ?, sizes = ?, description = ?, image = ?, category = ? WHERE id = ?",
    [data.name, data.price, data.shippingCharge, data.stock, JSON.stringify(data.sizes || []), data.description, data.image, data.category, id],
  );
  return findProductById(id);
}

export async function deleteProduct(id) {
  await query("DELETE FROM Product WHERE id = ?", [id]);
}

export async function archiveProduct(id) {
  await query("UPDATE Product SET published = 0 WHERE id = ?", [id]);
}

function normalizeReview(review) {
  if (!review) return null;
  return {
    ...review,
    rating: Number(review.rating),
  };
}

export async function listProductReviews(productId) {
  const rows = await query(
    `SELECT r.id, r.rating, r.comment, r.createdAt, r.updatedAt, r.productId, r.userId, u.name AS customerName
     FROM ProductReview r
     JOIN \`User\` u ON u.id = r.userId
     WHERE r.productId = ?
     ORDER BY r.updatedAt DESC`,
    [productId],
  );
  return rows.map(normalizeReview);
}

export async function findProductReviewByUser(productId, userId) {
  const rows = await query(
    `SELECT r.id, r.rating, r.comment, r.createdAt, r.updatedAt, r.productId, r.userId, u.name AS customerName
     FROM ProductReview r
     JOIN \`User\` u ON u.id = r.userId
     WHERE r.productId = ? AND r.userId = ?
     LIMIT 1`,
    [productId, userId],
  );
  return normalizeReview(rows[0]);
}

export async function customerCanReviewProduct(productId, userId) {
  const rows = await query(
    `SELECT oi.id
     FROM OrderItem oi
     JOIN \`Order\` o ON o.id = oi.orderId
     WHERE oi.productId = ? AND o.userId = ? AND o.status <> 'CANCELLED' AND oi.status <> 'CANCELLED'
     LIMIT 1`,
    [productId, userId],
  );
  return Boolean(rows[0]);
}

export async function upsertProductReview(productId, userId, data) {
  await query(
    `INSERT INTO ProductReview (productId, userId, rating, comment)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), updatedAt = CURRENT_TIMESTAMP`,
    [productId, userId, data.rating, data.comment],
  );
  return findProductReviewByUser(productId, userId);
}

export async function listWishlistProducts(userId) {
  const rows = await query(
    "SELECT p.* FROM WishlistItem w JOIN Product p ON p.id = w.productId WHERE w.userId = ? AND p.published = 1 ORDER BY w.createdAt DESC",
    [userId],
  );
  return rows.map(normalizeProduct);
}

export async function addWishlistItem(userId, productId) {
  await query("INSERT IGNORE INTO WishlistItem (userId, productId) VALUES (?, ?)", [userId, productId]);
}

export async function removeWishlistItem(userId, productId) {
  await query("DELETE FROM WishlistItem WHERE userId = ? AND productId = ?", [userId, productId]);
}

export async function listSellerNotices(sellerId) {
  return query("SELECT * FROM SellerNotice WHERE sellerId = ? ORDER BY createdAt DESC", [sellerId]);
}

export async function markSellerNoticeRead(id, sellerId) {
  await query("UPDATE SellerNotice SET readAt = NOW() WHERE id = ? AND sellerId = ?", [id, sellerId]);
}

export async function createSellerNotice(sellerId, message) {
  const [result] = await db.execute("INSERT INTO SellerNotice (sellerId, message) VALUES (?, ?)", [sellerId, message]);
  const rows = await query("SELECT * FROM SellerNotice WHERE id = ?", [result.insertId]);
  return rows[0];
}

export async function deleteSellerNotice(id, sellerId) {
  const [result] = await db.execute("DELETE FROM SellerNotice WHERE id = ? AND sellerId = ?", [id, sellerId]);
  return result.affectedRows;
}

export async function listOrderRows({ role, userId, sellerId }) {
  const where = [];
  const params = [];
  if (role === "CUSTOMER") {
    where.push("o.userId = ?");
    params.push(userId);
  } else if (role === "SELLER") {
    where.push("p.sellerId = ?");
    params.push(userId);
  } else if (sellerId) {
    where.push("p.sellerId = ?");
    params.push(sellerId);
  }
  return query(
    `SELECT o.*, oi.id AS itemId, oi.quantity, oi.size AS itemSize, oi.price AS itemPrice, oi.shippingCharge AS itemShippingCharge, oi.status AS itemStatus, oi.productId, p.name AS productName, p.image AS productImage, p.sellerId AS productSellerId
     FROM \`Order\` o
     JOIN OrderItem oi ON oi.orderId = o.id
     JOIN Product p ON p.id = oi.productId
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY o.createdAt DESC, oi.id ASC`,
    params,
  );
}

export function groupOrderRows(rows) {
  const orders = new Map();
  for (const row of rows) {
    if (!orders.has(row.id)) {
      orders.set(row.id, normalizeOrder({
        id: row.id,
        status: row.status,
        total: row.total,
        customerEmail: row.customerEmail,
        customerName: row.customerName,
        shippingAddress: row.shippingAddress,
        shippingCity: row.shippingCity,
        shippingPostalCode: row.shippingPostalCode,
        shippingState: row.shippingState,
        shippingCountry: row.shippingCountry,
        paymentMethod: row.paymentMethod,
        paymentStatus: row.paymentStatus,
        createdAt: row.createdAt,
        userId: row.userId,
        items: [],
      }));
    }
    if (row.itemId) {
      orders.get(row.id).items.push({
        id: row.itemId,
        quantity: row.quantity,
        price: Number(row.itemPrice),
        shippingCharge: Number(row.itemShippingCharge || 0),
        selectedSize: row.itemSize || null,
        status: row.itemStatus,
        orderId: row.id,
        productId: row.productId,
        product: { name: row.productName, image: row.productImage, sellerId: row.productSellerId },
      });
    }
  }
  return Array.from(orders.values());
}

export async function findOrderWithItems(id, connection = db) {
  const [rows] = await connection.execute(
    `SELECT o.*, oi.id AS itemId, oi.quantity, oi.size AS itemSize, oi.price AS itemPrice, oi.shippingCharge AS itemShippingCharge, oi.status AS itemStatus, oi.productId, p.sellerId AS productSellerId, p.name AS productName, p.image AS productImage
     FROM \`Order\` o
     LEFT JOIN OrderItem oi ON oi.orderId = o.id
     LEFT JOIN Product p ON p.id = oi.productId
     WHERE o.id = ?
     ORDER BY oi.id ASC`,
    [id],
  );
  return groupOrderRows(rows)[0] || null;
}

export async function createOrderWithItems(data, items, productById) {
  return transaction(async (connection) => {
    await updateCustomerCheckoutProfile(connection, data.userId, {
      name: data.customerName,
      address: data.shippingAddress,
      city: data.shippingCity,
      postalCode: data.shippingPostalCode,
      state: data.shippingState,
      country: data.shippingCountry,
    });
    for (const item of items) {
      const product = productById.get(item.id);
      if (item.selectedSize && product.sizes?.length) {
        const sizes = product.sizes.map((entry) => entry.size.toLowerCase() === item.selectedSize.toLowerCase() ? { ...entry, stock: entry.stock - item.quantity } : entry);
        await connection.execute("UPDATE Product SET stock = stock - ?, sizes = ? WHERE id = ?", [item.quantity, JSON.stringify(sizes), item.id]);
        product.sizes = sizes;
      } else {
        await connection.execute("UPDATE Product SET stock = stock - ? WHERE id = ?", [item.quantity, item.id]);
      }
    }
    const [result] = await connection.execute(
      "INSERT INTO `Order` (customerEmail, customerName, shippingAddress, shippingCity, shippingPostalCode, shippingState, shippingCountry, paymentMethod, paymentStatus, total, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)",
      [data.customerEmail, data.customerName, data.shippingAddress, data.shippingCity, data.shippingPostalCode, data.shippingState, data.shippingCountry, data.paymentMethod, data.total, data.userId],
    );
    for (const item of items) {
      const product = productById.get(item.id);
      await connection.execute(
        "INSERT INTO OrderItem (quantity, size, price, shippingCharge, orderId, productId) VALUES (?, ?, ?, ?, ?, ?)",
        [item.quantity, item.selectedSize, product.price, product.shippingCharge || 0, result.insertId, item.id],
      );
    }
    return findOrderWithItems(result.insertId, connection);
  });
}

export async function cancelOrder(order) {
  return transaction(async (connection) => {
    await connection.execute("UPDATE OrderItem SET status = 'CANCELLED' WHERE orderId = ?", [order.id]);
    for (const item of order.items) {
      await connection.execute("UPDATE Product SET stock = stock + ? WHERE id = ?", [item.quantity, item.productId]);
    }
    await connection.execute("UPDATE `Order` SET status = 'CANCELLED' WHERE id = ?", [order.id]);
    return findOrderWithItems(order.id, connection);
  });
}

export async function updateOrderItemsStatus(order, ownedItemIds, status, itemId) {
  return transaction(async (connection) => {
    if (itemId) {
      await connection.execute("UPDATE OrderItem SET status = ? WHERE id = ?", [status, itemId]);
    } else if (ownedItemIds.length) {
      await connection.query("UPDATE OrderItem SET status = ? WHERE orderId = ? AND id IN (?)", [status, order.id, ownedItemIds]);
    }
    const [items] = await connection.execute("SELECT status FROM OrderItem WHERE orderId = ?", [order.id]);
    const itemStatuses = items.map((item) => item.status);
    const orderStatus = itemStatuses.every((itemStatus) => itemStatus === "DELIVERED") ? "DELIVERED" : itemStatuses.every((itemStatus) => itemStatus === "CANCELLED") ? "CANCELLED" : itemStatuses.some((itemStatus) => itemStatus === "SHIPPED") ? "SHIPPED" : itemStatuses.some((itemStatus) => itemStatus === "PROCESSING") ? "PROCESSING" : "PENDING";
    await connection.execute("UPDATE `Order` SET status = ? WHERE id = ?", [orderStatus, order.id]);
    return findOrderWithItems(order.id, connection);
  });
}
