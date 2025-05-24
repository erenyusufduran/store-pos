const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Product operations
  getProductByBarcode: (barcode) => ipcRenderer.invoke('get-product-by-barcode', barcode),
  getPopularProducts: (limit) => ipcRenderer.invoke('get-popular-products', limit),
  getProductsByCategory: (categoryId) => ipcRenderer.invoke('get-products-by-category', categoryId),
  getProducts: (params) => ipcRenderer.invoke('get-products', params),
  getProductsCount: (params) => ipcRenderer.invoke('get-products-count', params),
  addProduct: (product) => ipcRenderer.invoke('add-product', product),
  updateProductStock: (data) => ipcRenderer.invoke('update-product-stock', data),
  
  // Category operations
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (category) => ipcRenderer.invoke('add-category', category),
  
  // Sales operations
  createSale: (saleData) => ipcRenderer.invoke('create-sale', saleData),
  getTodaySales: () => ipcRenderer.invoke('get-today-sales'),
  getSalesByDate: (date) => ipcRenderer.invoke('get-sales-by-date', date),
  getSalesByDateRange: (startDate, endDate) => ipcRenderer.invoke('get-sales-by-date-range', startDate, endDate),
  getSaleDetails: (saleId) => ipcRenderer.invoke('get-sale-details', saleId),
  deleteSale: (saleId) => ipcRenderer.invoke('delete-sale', saleId),

  // Additional product operations
  updateProduct: (product) => ipcRenderer.invoke('update-product', product),
  deleteProduct: (productId) => ipcRenderer.invoke('delete-product', productId),
  
  // Database management operations
  exportDatabase: () => ipcRenderer.invoke('export-database'),
  getTableData: (tableName) => ipcRenderer.invoke('get-table-data', tableName),
  backupDatabase: (backupPath) => ipcRenderer.invoke('backup-database', backupPath),

  // Settings operations
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
}); 