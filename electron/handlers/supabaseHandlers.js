const { ipcMain } = require("electron");
const { supabase } = require("../supabase/client");
const { runExec, runQuery } = require("../database/utils");

function setupSupabaseHandlers() {
  // Check if online and connected to Supabase
  ipcMain.handle("is-online", async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("count")
        .limit(1);
      return !error;
    } catch (error) {
      console.error("Supabase connection error:", error);
      return false;
    }
  });

  // Fetch data from Supabase table
  ipcMain.handle(
    "fetch-supabase-data",
    async (event, { tableName, columns }) => {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select(columns.join(","))
          .is("localId", null)
          .order("id", { ascending: false });

        if (error) throw error;

        if (data.length > 0) {
          columns = columns.filter((col) => col !== "id");
          columns.push("supabase_id");

          // Insert new data from Supabase
          const insertedRecords = [];
          const joinedColumns = columns.join(", ");
          const joinedValues = columns.map(() => `?`).join(", ");
          for (const item of data) {
            item.supabase_id = item.id;
            const values = columns.map((col) => item[col]);
            const insertQuery = `INSERT INTO ${tableName} (${joinedColumns}) VALUES (${joinedValues})`;
            const localId = runExec(insertQuery, values); // runExec returns last inserted id
            insertedRecords.push({ ...item, id: localId });
          }

          // Update supabase records with local IDs (geri besleme)
          for (const item of insertedRecords) {
            const { error } = await supabase
              .from(tableName)
              .update({ localId: item.id })
              .eq("id", item.supabase_id);
            if (error) throw error;
          }
        }
        
        return data;
      } catch (error) {
        console.error(`Error fetching ${tableName} data:`, error);
        throw error;
      }
    }
  );

  // Sync local database with Supabase
  ipcMain.handle("sync-supabase", async () => {
    try {
      const tables = ["products", "categories"];
      for (const table of tables) {
        await syncSupabaseTable(table);
      }
    } catch (error) {
      console.error("Error syncing with Supabase:", error);
      throw error;
    }
  });
}

async function syncSupabaseTable(tableName) {
  const query = `SELECT * FROM ${tableName} WHERE supabase_id IS NULL`;
  const localData = runQuery(query);

  if (!localData || localData.length === 0) return;

  const recordsToInsert = localData.map(({ id, supabase_id, ...rest }) => ({
    ...rest,
    localId: id,
  }));

  const { data, error } = await supabase
    .from(tableName)
    .insert(recordsToInsert)
    .select("id, localId");

  if (error) {
    console.error(`Failed to batch sync ${tableName}:`, error);
    return;
  }

  for (let i = 0; i < data.length; i++) {
    const { id: supabaseId, localId } = data[i];

    const updateQuery = `UPDATE ${tableName} SET supabase_id = ? WHERE id = ?`;
    runExec(updateQuery, [supabaseId, localId]);
  }

  console.log("synced", tableName, data.length);
}

module.exports = setupSupabaseHandlers;
