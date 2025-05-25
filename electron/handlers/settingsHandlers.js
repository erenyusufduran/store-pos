const { ipcMain } = require('electron');
const { runQuery, runQuerySingle, runExec } = require('../database/utils');

function setupSettingsHandlers() {
  // Get settings
  ipcMain.handle('get-settings', async () => {
    try {
      // Check if settings table exists
      const tableExists = runQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'");
      
      if (tableExists.length === 0) {
        // Create settings table if it doesn't exist
        runExec(`
          CREATE TABLE settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
          )
        `);
        
        // Insert default settings
        runExec(
          'INSERT INTO settings (key, value) VALUES (?, ?)',
          ['backstageMarginPercent', '0']
        );
      }

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
      if (settings.length === 0) {
        // If no password is set, set the default one
        runExec(
          'INSERT INTO settings (key, value) VALUES (?, ?)',
          ['adminPassword', 'admin123']
        );
        return password === 'admin123';
      }
      return password === settings[0].value;
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  });

  // Change password
  ipcMain.handle('change-password', async (event, newPassword) => {
    try {
      runExec(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        ['adminPassword', newPassword]
      );
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  });
}

module.exports = setupSettingsHandlers; 