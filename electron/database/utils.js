const { getDb, saveDatabase } = require('./setup');

// Helper function to run a query and get results
function runQuery(query, params = []) {
  const db = getDb();
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
  const db = getDb();
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
  runQuery,
  runQuerySingle,
  runExec
}; 