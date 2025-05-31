const { setupDatabase } = require("./database/setup");
const setupProductHandlers = require("./handlers/productHandlers");
const setupSaleHandlers = require("./handlers/saleHandlers");
const setupCategoryHandlers = require("./handlers/categoryHandlers");
const setupDatabaseHandlers = require("./handlers/databaseHandlers");
const setupSettingsHandlers = require("./handlers/settingsHandlers");
const setupSupabaseHandlers = require("./handlers/supabaseHandlers");

async function initializeDatabase() {
  await setupDatabase();

  // Setup all handlers
  setupProductHandlers();
  setupSaleHandlers();
  setupCategoryHandlers();
  setupDatabaseHandlers();
  setupSettingsHandlers();
  setupSupabaseHandlers();
}

module.exports = {
  setupDatabase: initializeDatabase,
};
