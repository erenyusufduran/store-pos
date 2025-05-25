const path = require('path');
const fs = require('fs');
const { app, ipcMain } = require('electron');
const { setupDatabase } = require('./database/setup');
const setupProductHandlers = require('./handlers/productHandlers');
const setupSaleHandlers = require('./handlers/saleHandlers');
const setupCategoryHandlers = require('./handlers/categoryHandlers');
const setupDatabaseHandlers = require('./handlers/databaseHandlers');
const setupSettingsHandlers = require('./handlers/settingsHandlers');

// Get the database directory path
const dbDir = path.join(app.getPath('userData'), 'database');

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'pos.db');
let db;

async function initializeDatabase() {
  await setupDatabase();
  
  // Setup all handlers
  setupProductHandlers();
  setupSaleHandlers();
  setupCategoryHandlers();
  setupDatabaseHandlers();
  setupSettingsHandlers();
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

module.exports = {
  setupDatabase: initializeDatabase
};
