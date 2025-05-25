const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");
const { app } = require("electron");

// Get the database directory path
const dbDir = path.join(app.getPath("userData"), "database");

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "pos.db");
let db = null;
let saveInterval = null;

async function setupDatabase() {
  try {
    // Initialize SQL.js
    const SQL = await initSqlJs();

    // Load database from file if it exists, otherwise create a new one
    let buffer;
    try {
      if (fs.existsSync(dbPath)) {
        buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
      } else {
        db = new SQL.Database();
      }
    } catch (err) {
      console.error("Error loading database:", err);
      db = new SQL.Database();
    }

    // Create tables if they don't exist
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          barcode TEXT UNIQUE,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          purchase_price REAL DEFAULT 0,
          stock INTEGER DEFAULT 0,
          category_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );
        
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          total_amount REAL NOT NULL,
          payment_type TEXT NOT NULL,
          is_backstage INTEGER DEFAULT 0,
          back_margin_percentage REAL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER,
          product_id INTEGER,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          FOREIGN KEY (sale_id) REFERENCES sales (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        );
      `);
    } catch (err) {
      console.error("Error creating tables:", err);
      throw err;
    }

    // Check if backstage columns exist in sales table
    try {
      const salesTableInfo = db.exec("PRAGMA table_info(sales);");
      const hasBackstageColumns = salesTableInfo[0].values.some(
        (col) => col[1] === "is_backstage" || col[1] === "back_margin_percentage"
      );

      if (!hasBackstageColumns) {
        db.exec(`
          ALTER TABLE sales ADD COLUMN is_backstage INTEGER DEFAULT 0;
          ALTER TABLE sales ADD COLUMN back_margin_percentage REAL DEFAULT 0;
        `);
      }
    } catch (err) {
      console.error("Error checking/adding backstage columns:", err);
    }

    // Check if purchase_price exists in products table
    try {
      const res = db.exec("PRAGMA table_info(products);");
      const hasPurchasePrice = res[0].values.some(
        (col) => col[1] === "purchase_price"
      );
      if (!hasPurchasePrice) {
        db.exec("ALTER TABLE products ADD COLUMN purchase_price REAL DEFAULT 0;");
      }
    } catch (err) {
      console.error("Error checking/adding purchase_price column:", err);
    }

    // Save the database to disk
    saveDatabase();

    // Set up periodic database saving
    if (saveInterval) {
      clearInterval(saveInterval);
    }
    saveInterval = setInterval(() => {
      try {
        saveDatabase();
      } catch (error) {
        console.error("Error in periodic database save:", error);
      }
    }, 30000); // Save every 30 seconds

    // Only import CSV if products table is empty
    try {
      const countRes = db.exec("SELECT COUNT(*) FROM products;");
      const productsCount = countRes[0].values[0][0];
      if (productsCount < 100) {
        importProductsFromCSV().catch(err => {
          console.error("Error importing products from CSV:", err);
        });
      }
    } catch (err) {
      console.error("Error checking product count:", err);
    }

    return db;
  } catch (error) {
    console.error("Failed to setup database:", error);
    throw error;
  }
}

// Helper function to save the database to disk
function saveDatabase() {
  if (!db) {
    console.error("No database connection available");
    return;
  }

  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (error) {
    console.error("Error saving database:", error);
    throw error;
  }
}

// Function to import products from urunListesi.csv
async function importProductsFromCSV() {
  const csvPath = path.join(__dirname, "urunListesi.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("urunListesi.csv not found");
    return;
  }

  try {
    const csvData = fs.readFileSync(csvPath, "utf-8");
    const lines = csvData.split(/\r?\n/).filter(Boolean);
    let inserted = 0;
    
    for (const line of lines) {
      // Split by tab or comma
      const parts = line.split("\t");
      if (parts.length < 4) continue;
      const [barcode, name, price, purchase_price] = parts;
      try {
        db.exec(
          `INSERT OR IGNORE INTO products (barcode, name, price, purchase_price, stock, category_id) VALUES (?, ?, ?, ?, 0, NULL);`,
          [barcode, name, parseFloat(price), parseFloat(purchase_price.replace(',', '.'))]
        );
        inserted++;
      } catch (err) {
        console.error("Error inserting product:", barcode, name, err.message);
      }
    }
    saveDatabase();
    console.log(`Imported ${inserted} products from urunListesi.csv`);
  } catch (error) {
    console.error("Error importing products from CSV:", error);
    throw error;
  }
}

// Cleanup function to be called when the app is quitting
function cleanup() {
  if (saveInterval) {
    clearInterval(saveInterval);
  }
  if (db) {
    try {
      saveDatabase();
    } catch (error) {
      console.error("Error saving database during cleanup:", error);
    }
  }
}

module.exports = {
  setupDatabase,
  saveDatabase,
  getDb: () => db,
  importProductsFromCSV,
  cleanup
};
