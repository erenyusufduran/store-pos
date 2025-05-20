const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const { app, ipcMain } = require('electron');

// Get the database directory path
const dbDir = path.join(app.getPath('userData'), 'database');

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'pos.db');
let db;

async function setupDatabase() {
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
    console.error('Error loading database:', err);
    db = new SQL.Database();
  }

  // Create tables if they don't exist
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
      stock INTEGER DEFAULT 0,
      category_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );
    
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_amount REAL NOT NULL,
      payment_type TEXT NOT NULL,
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

  // Save the database to disk
  saveDatabase();

  setupIpcHandlers();

  return db;
}

// Helper function to save the database to disk
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Helper function to run a query and get results
function runQuery(query, params = []) {
  try {
    const stmt = db.prepare(query);
    stmt.bind(params);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Helper function to run a single query and get one result
function runQuerySingle(query, params = []) {
  const results = runQuery(query, params);
  return results.length > 0 ? results[0] : null;
}

// Helper function to execute an insert/update and get last ID
function runExec(query, params = []) {
  try {
    const stmt = db.prepare(query);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    
    // Get last insert ID
    const lastId = runQuerySingle('SELECT last_insert_rowid() as id');
    saveDatabase(); // Save changes to disk
    return lastId ? lastId.id : null;
  } catch (error) {
    console.error('Exec error:', error);
    throw error;
  }
}

function setupIpcHandlers() {
  // Product related handlers
  ipcMain.handle('get-product-by-barcode', (event, barcode) => {
    return runQuerySingle('SELECT * FROM products WHERE barcode = ?', [barcode]);
  });

  ipcMain.handle('get-popular-products', (event, limit = 10) => {
    return runQuery(`
      SELECT p.*, COUNT(si.id) as sold_count 
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      GROUP BY p.id
      ORDER BY sold_count DESC
      LIMIT ?
    `, [limit]);
  });

  ipcMain.handle('get-products-by-category', (event, categoryId) => {
    return runQuery('SELECT * FROM products WHERE category_id = ?', [categoryId]);
  });

  ipcMain.handle('add-product', (event, product) => {
    try {
      const { barcode, name, price, stock, category_id } = product;
      const id = runExec(
        'INSERT INTO products (barcode, name, price, stock, category_id) VALUES (?, ?, ?, ?, ?)',
        [barcode, name, price, stock || 0, category_id]
      );
      return { id, ...product };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return 'Bu barkod numarasına sahip bir ürün zaten mevcut.';
      }
      throw error;
    }
  });

  ipcMain.handle('update-product-stock', (event, { productId, newStock }) => {
    runExec('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId]);
    saveDatabase();
    return true;
  });

  // Category related handlers
  ipcMain.handle('get-categories', () => {
    return runQuery('SELECT * FROM categories');
  });

  ipcMain.handle('add-category', (event, category) => {
    const id = runExec('INSERT INTO categories (name) VALUES (?)', [category]);
    return { id, name: category };
  });

  // Sales related handlers
  ipcMain.handle('create-sale', (event, { totalAmount, paymentType, items }) => {
    try {
      // Create sale
      const saleId = runExec(
        'INSERT INTO sales (total_amount, payment_type) VALUES (?, ?)',
        [totalAmount, paymentType]
      );
      
      // Add items and update stock
      items.forEach((item) => {
        runExec(
          'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [saleId, item.productId, item.quantity, item.price]
        );
        
        runExec(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.productId]
        );
      });
      
      saveDatabase();
      return saleId;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  });

  ipcMain.handle('get-today-sales', () => {
    const today = new Date().toISOString().split('T')[0];
    return runQuery(`
      SELECT s.*, 
             GROUP_CONCAT(p.name || ' (' || si.quantity || ')') as items
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE DATE(s.created_at) = DATE(?)
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [today]);
  });

  ipcMain.handle('get-sales-by-date', (event, date) => {
    return runQuery(`
      SELECT s.id, s.total_amount, s.payment_type, s.created_at,
             COUNT(si.id) as items_count
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      WHERE DATE(s.created_at) = DATE(?)
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [date]);
  });

  ipcMain.handle('get-sales-by-date-range', (event, startDate, endDate) => {
    console.log(startDate, endDate);
    return runQuery(`
      SELECT s.id, s.total_amount, s.payment_type, s.created_at,
             COUNT(si.id) as items_count
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      WHERE DATE(s.created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [startDate, endDate]);
  });

  ipcMain.handle('get-sale-details', (event, saleId) => {
    // Get the sale header
    const sale = runQuerySingle('SELECT * FROM sales WHERE id = ?', [saleId]);

    if (!sale) return null;

    // Get the sale items with product details
    const items = runQuery(`
      SELECT si.*, p.name as product_name, p.barcode
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [saleId]);

    return {
      ...sale,
      items
    };
  });

  ipcMain.handle('delete-sale', (event, saleId) => {
    try {
      // Delete sale items
      runExec('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
      
      // Delete the sale
      runExec('DELETE FROM sales WHERE id = ?', [saleId]);
      
      saveDatabase();
      return { success: true, message: 'Sale deleted successfully.' };
    } catch (error) {
      console.error('Error deleting sale:', error);
      return { success: false, message: error.message };
    }
  });

  // Add a handler to update an existing product
  ipcMain.handle('update-product', (event, product) => {
    const { id, barcode, name, price, stock, category_id } = product;
    console.log(product);
    runExec(
      `
      UPDATE products 
      SET barcode = ?, name = ?, price = ?, stock = ?, category_id = ? 
      WHERE id = ?
    `,
      [barcode, name, price, stock, category_id, id]
    );

    return product;
  });

  ipcMain.handle('get-products', () => {
    return runQuery('SELECT * FROM products ORDER BY name ASC');
  });

  // Add a handler to delete a product
  ipcMain.handle('delete-product', (event, productId) => {
    try {
      // Check if the product is used in any sales
      const usedInSales = runQuerySingle('SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?', [productId]);

      if (usedInSales.count > 0) {
        // If product is used in sales, we should mark it as inactive rather than deleting
        // For now, we'll just set stock to 0 to prevent further sales
        runExec('UPDATE products SET stock = 0 WHERE id = ?', [productId]);
        return { success: true, message: 'Product has sales history. Stock set to 0.', stock: 0 };
      } else {
        // If not used in sales, we can safely delete it
        runExec('DELETE FROM products WHERE id = ?', [productId]);
        return { success: true, message: 'Product deleted successfully.' };
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, message: error.message };
    }
  });

  // Add handlers for database viewing/export
  ipcMain.handle('export-database', () => {
    try {
      // Get all tables in the database
      const tables = runQuery("SELECT name FROM sqlite_master WHERE type='table'");
      
      const dbExport = {};
      
      // For each table, get all rows
      tables.forEach(table => {
        const tableName = table.name;
        if (tableName !== 'sqlite_sequence') { // Skip internal SQLite tables
          dbExport[tableName] = runQuery(`SELECT * FROM ${tableName}`);
        }
      });
      
      return dbExport;
    } catch (error) {
      console.error('Error exporting database:', error);
      return { error: error.message };
    }
  });
  
  ipcMain.handle('get-table-data', (event, tableName) => {
    try {
      // Validate table name to prevent SQL injection
      const tables = runQuery("SELECT name FROM sqlite_master WHERE type='table'");
      const validTable = tables.find(t => t.name === tableName);
      
      if (!validTable) {
        return { error: 'Invalid table name' };
      }
      
      return runQuery(`SELECT * FROM ${tableName}`);
    } catch (error) {
      console.error(`Error getting data from table ${tableName}:`, error);
      return { error: error.message };
    }
  });
  
  ipcMain.handle('backup-database', (event, backupPath) => {
    try {
      // Export the database to a file
      const data = db.export();
      const buffer = Buffer.from(data);
      
      // If no path provided, create one in the app's userData folder
      if (!backupPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        backupPath = path.join(app.getPath('userData'), 'backups', `pos-backup-${timestamp}.db`);
        
        // Ensure backup directory exists
        const backupDir = path.dirname(backupPath);
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
      }
      
      fs.writeFileSync(backupPath, buffer);
      return { success: true, path: backupPath };
    } catch (error) {
      console.error('Error backing up database:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  setupDatabase
};
