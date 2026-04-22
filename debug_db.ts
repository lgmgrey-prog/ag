
import Database from "better-sqlite3";
const db = new Database("procurehub.db");
const users = db.prepare("SELECT id, inn, email, name FROM users").all();
console.log("USERS IN DB:", JSON.stringify(users, null, 2));
