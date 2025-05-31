require("dotenv").config();
const path = require("path");
const { app } = require("electron");

// Get the root directory of your project
const rootDir = path.join(__dirname, "../../");

const isDev = !app?.isPackaged || true;

// Load environment variables from .env file
require("dotenv").config({
  path: path.join(rootDir, isDev ? ".env.development" : ".env"),
});

const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

// Initialize store with dynamic import
let store;
(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store({ encryptionKey: "1234567890" });
  
  store.set("supabase_url", process.env.SUPABASE_URL);
  store.set("supabase_anon_key", process.env.SUPABASE_ANON_KEY);
})();

module.exports = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_EMAIL: process.env.SUPABASE_EMAIL,
  SUPABASE_PASSWORD: process.env.SUPABASE_PASSWORD,
  SYNC_INTERVAL: 5000, // 5 seconds
  MAX_RETRY_ATTEMPTS: 3,
  DEVICE_ID: app.getPath("userData").split("/").pop(), // Unique device identifier
  isDev,
};