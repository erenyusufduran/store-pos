const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { runQuery, getDb } = require('../database/utils');

function setupDatabaseHandlers() {
  ipcMain.handle('export-database', () => {
    try {
      const tables = runQuery("SELECT name FROM sqlite_master WHERE type='table'");
      
      const dbExport = {};
      
      tables.forEach(table => {
        const tableName = table.name;
        if (tableName !== 'sqlite_sequence') {
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
      const db = getDb();
      const data = db.export();
      const buffer = Buffer.from(data);
      
      if (!backupPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        backupPath = path.join(app.getPath('userData'), 'backups', `pos-backup-${timestamp}.db`);
        
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

module.exports = setupDatabaseHandlers; 