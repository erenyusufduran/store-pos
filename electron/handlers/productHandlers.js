const { ipcMain } = require('electron');
const { runQuery, runQuerySingle, runExec } = require('../database/utils');

function setupProductHandlers() {
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
      const { barcode, name, price, stock, category_id, purchase_price } = product;
      const id = runExec(
        'INSERT INTO products (barcode, name, price, stock, category_id, purchase_price) VALUES (?, ?, ?, ?, ?, ?)',
        [barcode, name, price, stock || 0, category_id, purchase_price || 0]
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
    return true;
  });

  ipcMain.handle('update-product', (event, product) => {
    const { id, barcode, name, price, stock, category_id, purchase_price } = product;
    runExec(
      `
      UPDATE products 
      SET barcode = ?, name = ?, price = ?, stock = ?, category_id = ?, purchase_price = ? 
      WHERE id = ?
    `,
      [barcode, name, price, stock, category_id, purchase_price || 0, id]
    );
    return product;
  });

  ipcMain.handle('get-products', (event, { page = 1, limit = 50, filters = {} }) => {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM products';
    let countQuery = 'SELECT COUNT(*) as total FROM products';
    const params = [];
    const whereConditions = [];

    // Apply filters
    if (filters.category) {
      whereConditions.push('category_id = ?');
      params.push(filters.category);
    }
    if (filters.barcode) {
      whereConditions.push('barcode LIKE ?');
      params.push(`%${filters.barcode}%`);
    }
    if (filters.name) {
      whereConditions.push('name LIKE ?');
      params.push(`%${filters.name}%`);
    }
    if (filters.price) {
      whereConditions.push('price LIKE ?');
      params.push(`%${filters.price}%`);
    }
    if (filters.purchasePrice) {
      whereConditions.push('purchase_price LIKE ?');
      params.push(`%${filters.purchasePrice}%`);
    }

    // Add WHERE clause if there are filters
    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Add ORDER BY and LIMIT
    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Get total count
    const total = runQuerySingle(countQuery, params.slice(0, -2));
    const products = runQuery(query, params);


    return {
      products,
      total: total.total
    };
  });

  ipcMain.handle('get-products-count', (event, filters = {}) => {
    let query = 'SELECT COUNT(*) as total FROM products';
    const params = [];
    const whereConditions = [];

    // Apply filters
    if (filters.category) {
      whereConditions.push('category_id = ?');
      params.push(filters.category);
    }
    if (filters.barcode) {
      whereConditions.push('barcode LIKE ?');
      params.push(`%${filters.barcode}%`);
    }
    if (filters.name) {
      whereConditions.push('name LIKE ?');
      params.push(`%${filters.name}%`);
    }
    if (filters.price) {
      whereConditions.push('price LIKE ?');
      params.push(`%${filters.price}%`);
    }
    if (filters.purchasePrice) {
      whereConditions.push('purchase_price LIKE ?');
      params.push(`%${filters.purchasePrice}%`);
    }

    // Add WHERE clause if there are filters
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    const result = runQuerySingle(query, params);
    return result.total;
  });

  ipcMain.handle('delete-product', (event, productId) => {
    try {
      const usedInSales = runQuerySingle('SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?', [productId]);

      if (usedInSales.count > 0) {
        runExec('UPDATE products SET stock = 0 WHERE id = ?', [productId]);
        return { success: true, message: 'Product has sales history. Stock set to 0.', stock: 0 };
      } else {
        runExec('DELETE FROM products WHERE id = ?', [productId]);
        return { success: true, message: 'Product deleted successfully.' };
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, message: error.message };
    }
  });
}

module.exports = setupProductHandlers; 