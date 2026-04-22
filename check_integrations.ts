
import Database from "better-sqlite3";
const db = new Database("procurehub.db");
const integrations = db.prepare("SELECT * FROM integrations").all();
console.log("INTEGRATIONS IN DB:", JSON.stringify(integrations, null, 2));
const users = db.prepare("SELECT id, name, email FROM users").all();
console.log("USERS IN DB:", JSON.stringify(users, null, 2));
