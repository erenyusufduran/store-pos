const { ipcMain } = require('electron');
const { runQuery, runQuerySingle, runExec } = require('../database/utils');

function setupSaleHandlers() {
  ipcMain.handle('create-sale', (event, { totalAmount, paymentType, items, isBackstage, backMarginPercentage }) => {
    try {
      // Create sale
      const saleId = runExec(
        'INSERT INTO sales (total_amount, payment_type, is_backstage, back_margin_percentage) VALUES (?, ?, ?, ?)',
        [totalAmount, paymentType, isBackstage ? 1 : 0, backMarginPercentage]
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
    const sale = runQuerySingle('SELECT * FROM sales WHERE id = ?', [saleId]);

    if (!sale) return null;

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
      runExec('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
      runExec('DELETE FROM sales WHERE id = ?', [saleId]);
      return { success: true, message: 'Sale deleted successfully.' };
    } catch (error) {
      console.error('Error deleting sale:', error);
      return { success: false, message: error.message };
    }
  });
}

module.exports = setupSaleHandlers; 