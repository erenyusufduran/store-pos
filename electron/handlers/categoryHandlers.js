const { ipcMain } = require('electron');
const { runQuery, runExec } = require('../database/utils');

function setupCategoryHandlers() {
  ipcMain.handle('get-categories', () => {
    return runQuery('SELECT * FROM categories');
  });

  ipcMain.handle('add-category', (event, category) => {
    const id = runExec('INSERT INTO categories (name) VALUES (?)', [category]);
    return { id, name: category };
  });
}

module.exports = setupCategoryHandlers; 