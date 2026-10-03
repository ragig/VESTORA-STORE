const mysql = require("mysql2/promise");

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

async function main() {
  const connection = await mysql.createConnection(databaseConfig());

  const [columns] = await connection.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Product'",
  );
  const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!existingColumns.has("shippingCharge")) {
    await connection.execute("ALTER TABLE Product ADD COLUMN shippingCharge DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER price");
  }
  if (!existingColumns.has("published")) {
    await connection.execute("ALTER TABLE Product ADD COLUMN published TINYINT(1) NOT NULL DEFAULT 1 AFTER stock");
  }
  if (!existingColumns.has("sellerId")) {
    await connection.execute("ALTER TABLE Product ADD COLUMN sellerId INT NULL AFTER published");
  }
  if (!existingColumns.has("sizes")) {
    await connection.execute("ALTER TABLE Product ADD COLUMN sizes JSON NULL AFTER stock");
  }
  const [orderColumns] = await connection.execute(
    "SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'OrderItem' AND COLUMN_NAME = 'size'",
  );
  if (!orderColumns[0].count) {
    await connection.execute("ALTER TABLE OrderItem ADD COLUMN size VARCHAR(50) NULL AFTER quantity");
  }
  if (existingColumns.has("createdAt")) {
    await connection.execute("ALTER TABLE Product MODIFY COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
  }
  if (existingColumns.has("updatedAt")) {
    await connection.execute("ALTER TABLE Product MODIFY COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  }
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ProductReview (
      id INT NOT NULL AUTO_INCREMENT,
      productId INT NOT NULL,
      userId INT NOT NULL,
      rating INT NOT NULL,
      comment TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY product_user_unique (productId, userId),
      CONSTRAINT ProductReview_productId_fkey FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE,
      CONSTRAINT ProductReview_userId_fkey FOREIGN KEY (userId) REFERENCES \`User\`(id) ON DELETE CASCADE
    )
  `);

  await connection.end();
  console.log("Product seller fields are ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
