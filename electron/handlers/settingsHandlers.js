const { ipcMain } = require('electron');
const { runQuery, runQuerySingle, runExec } = require('../database/utils');

function setupSettingsHandlers() {
  // Get settings
  ipcMain.handle('get-settings', async () => {
    try {
      // Get settings
      const settings = runQuery('SELECT key, value FROM settings');
      const settingsObj = {};
      
      settings.forEach(setting => {
        settingsObj[setting.key] = parseFloat(setting.value) || setting.value;
      });

      return settingsObj;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  });

  // Save settings
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        runExec(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [key, value.toString()]
        );
      }
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  });

  // Verify password
  ipcMain.handle('verify-password', async (event, password) => {
    try {
      const settings = runQuery('SELECT value FROM settings WHERE key = ?', ['adminPassword']);
      return password === settings[0].value;
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  });

  // Change password
  ipcMain.handle('change-password', async (event, newPassword) => {
    try {
      runExec('UPDATE settings SET value = ? WHERE key = ?', [newPassword, 'adminPassword']);
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  });

  ipcMain.handle('get-admin-password', async () => {
    try {
      const settings = runQuery('SELECT value FROM settings WHERE key = ?', ['adminPwd']);
      console.log(settings);
      return settings[0].value;
    } catch (error) {
      console.error('Error getting admin password:', error);
      throw error;
    }
  });

  ipcMain.handle('forget-password', async (event, newPassword) => {
    try {
      runExec('UPDATE settings SET value = ? WHERE key = ?', [newPassword, 'adminPassword']);
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  });

  ipcMain.handle('clean-database', async () => {
    try {
      runExec('DELETE FROM products');
      runExec('DELETE FROM categories');
      runExec('DELETE FROM sales');
      runExec('DELETE FROM sale_items');
      runExec('DELETE FROM settings');
      return true;
    } catch (error) {
      console.error('Error cleaning database:', error);
      throw error;
    }
  });
}

module.exports = setupSettingsHandlers; 