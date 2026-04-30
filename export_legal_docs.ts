
import Database from "better-sqlite3";
const db = new Database("database.sqlite");

try {
  const settings = db.prepare("SELECT key, value FROM global_settings WHERE key IN ('public_offer', 'privacy_policy', 'legal_info')").all();
  console.log(JSON.stringify(settings, null, 2));
} catch (e) {
  console.error("Error fetching settings:", e);
}
