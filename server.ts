import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import axios from "axios";
import crypto from "crypto";
import { google } from "googleapis";
import cookieSession from "cookie-session";
import xlsx from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("procurehub.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inn TEXT UNIQUE,
    name TEXT,
    type TEXT, -- 'restaurant' or 'supplier'
    email TEXT,
    password TEXT,
    settings TEXT, -- JSON string
    subscription TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    category TEXT,
    unit TEXT
  );

  CREATE TABLE IF NOT EXISTS price_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER,
    product_id INTEGER,
    price REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(supplier_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id),
    UNIQUE(supplier_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER,
    supplier_id INTEGER,
    image_url TEXT,
    amount REAL,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS integrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- 'iiko'
    api_login TEXT,
    organization_id TEXT,
    last_sync DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER,
    supplier_id INTEGER,
    items TEXT, -- JSON string
    total REAL,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(restaurant_id) REFERENCES users(id),
    FOREIGN KEY(supplier_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    robokassa_login TEXT,
    robokassa_pass1 TEXT,
    robokassa_pass2 TEXT,
    robokassa_test BOOLEAN,
    datanewton_api_key TEXT,
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_user TEXT,
    smtp_pass TEXT,
    base_url TEXT,
    google_client_id TEXT,
    google_client_secret TEXT,
    google_redirect_uri TEXT,
    session_secret TEXT,
    gemini_api_key TEXT,
    smtp_from TEXT
  );

  CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    subject TEXT,
    body TEXT,
    description TEXT
  );
`);

// Migration: Add columns if they don't exist
try {
  db.prepare("ALTER TABLE system_settings ADD COLUMN smtp_from TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE system_settings ADD COLUMN gemini_api_key TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE system_settings ADD COLUMN session_secret TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE system_settings ADD COLUMN base_url TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE users ADD COLUMN subscription TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE users ADD COLUMN last_login DATETIME").run();
} catch (e) {}

try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_product ON price_lists(supplier_id, product_id)");
} catch (e) {}

try {
  db.prepare("ALTER TABLE system_settings ADD COLUMN google_client_id TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE system_settings ADD COLUMN google_client_secret TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE system_settings ADD COLUMN google_redirect_uri TEXT").run();
} catch (e) {}

// Initial settings insert (AFTER migrations to ensure columns exist)
db.exec(`
  INSERT OR IGNORE INTO system_settings (id, robokassa_login, robokassa_pass1, robokassa_pass2, robokassa_test, datanewton_api_key, base_url, google_client_id, google_client_secret, google_redirect_uri, session_secret, gemini_api_key, smtp_from)
  VALUES (1, 'test_merchant', 'pass1', 'pass2', 1, '', '', '', '', '', 'secret-key', '', 'no-reply@restcost.ru');
`);

// Seed default email templates
const defaultTemplates = [
  {
    id: 'welcome',
    subject: 'Добро пожаловать в ProcureHub',
    body: '<p>Добро пожаловать в <b>ProcureHub</b>!</p><p>Ваш временный пароль для входа: <b>{{password}}</b></p><p><a href="{{base_url}}">Войти в систему</a></p>',
    description: 'Письмо при регистрации нового пользователя'
  },
  {
    id: 'password_reset',
    subject: 'Восстановление пароля ProcureHub',
    body: '<p>Вы запросили восстановление пароля.</p><p>Ваш новый пароль: <b>{{password}}</b></p><p><a href="{{base_url}}">Войти в систему</a></p>',
    description: 'Письмо при восстановлении пароля'
  },
  {
    id: 'order_created',
    subject: 'Новый заказ #{{order_id}}',
    body: '<p>Создан новый заказ #{{order_id}}.</p><p>Сумма: {{total}} руб.</p><p><a href="{{base_url}}">Посмотреть детали</a></p>',
    description: 'Уведомление о новом заказе'
  }
];

defaultTemplates.forEach(t => {
  db.prepare("INSERT OR IGNORE INTO email_templates (id, subject, body, description) VALUES (?, ?, ?, ?)").run(t.id, t.subject, t.body, t.description);
});


// Helper to get system settings
function getSystemSettings() {
  const settings = db.prepare("SELECT * FROM system_settings WHERE id = 1").get() as any;
  return {
    robokassa_login: settings?.robokassa_login || process.env.ROBOKASSA_LOGIN || "test_merchant",
    robokassa_pass1: settings?.robokassa_pass1 || process.env.ROBOKASSA_PASS1 || "pass1",
    robokassa_pass2: settings?.robokassa_pass2 || process.env.ROBOKASSA_PASS2 || "pass2",
    robokassa_test: settings?.robokassa_test !== undefined ? Boolean(settings.robokassa_test) : process.env.ROBOKASSA_TEST === "true",
    datanewton_api_key: settings?.datanewton_api_key || process.env.DATANEWTON_API_KEY || "",
    smtp_host: settings?.smtp_host || process.env.SMTP_HOST || "",
    smtp_port: settings?.smtp_port || parseInt(process.env.SMTP_PORT || "587"),
    smtp_user: settings?.smtp_user || process.env.SMTP_USER || "",
    smtp_pass: settings?.smtp_pass || process.env.SMTP_PASS || "",
    base_url: settings?.base_url || process.env.APP_URL || "",
    google_client_id: settings?.google_client_id || process.env.GOOGLE_CLIENT_ID || "",
    google_client_secret: settings?.google_client_secret || process.env.GOOGLE_CLIENT_SECRET || "",
    google_redirect_uri: settings?.google_redirect_uri || process.env.GOOGLE_REDIRECT_URI || "",
    session_secret: settings?.session_secret || process.env.SESSION_SECRET || "secret-key",
    gemini_api_key: settings?.gemini_api_key || process.env.GEMINI_API_KEY || "",
    smtp_from: settings?.smtp_from || process.env.SMTP_FROM || "no-reply@restcost.ru"
  };
}

function seedDatabase() {
  // Clear tables
  db.exec(`
    DELETE FROM users;
    DELETE FROM products;
    DELETE FROM price_lists;
    DELETE FROM messages;
    DELETE FROM invoices;
    DELETE FROM integrations;
    DELETE FROM orders;
  `);

  // Reset autoincrement
  db.exec(`
    DELETE FROM sqlite_sequence WHERE name IN ('users', 'products', 'price_lists', 'messages', 'invoices', 'integrations', 'orders');
  `);

  // Insert Admin
  db.prepare("INSERT INTO users (inn, name, type, email, password) VALUES (?, ?, ?, ?, ?)").run(
    '0000000000', 'Admin', 'admin', 'lgm.grey@gmail.com', 'admin'
  );

  // Insert Restaurant
  db.prepare("INSERT INTO users (inn, name, type, email, password) VALUES (?, ?, ?, ?, ?)").run(
    '1234567890', 'Ресторан "Вкусный"', 'restaurant', 'rest@example.com', 'password'
  );

  // Insert Suppliers
  const s1 = db.prepare("INSERT INTO users (inn, name, type, email, password) VALUES (?, ?, ?, ?, ?)").run(
    '1111111111', 'Поставщик Овощей', 'supplier', 'sup1@example.com', 'password'
  );
  const s2 = db.prepare("INSERT INTO users (inn, name, type, email, password) VALUES (?, ?, ?, ?, ?)").run(
    '2222222222', 'Мясной Двор', 'supplier', 'sup2@example.com', 'password'
  );
  const s3 = db.prepare("INSERT INTO users (inn, name, type, email, password) VALUES (?, ?, ?, ?, ?)").run(
    '3333333333', 'Молочная Ферма', 'supplier', 'sup3@example.com', 'password'
  );

  // Insert Products
  const p1 = db.prepare("INSERT INTO products (name, category, unit) VALUES (?, ?, ?)").run('Помидоры', 'Овощи', 'кг');
  const p2 = db.prepare("INSERT INTO products (name, category, unit) VALUES (?, ?, ?)").run('Огурцы', 'Овощи', 'кг');
  const p3 = db.prepare("INSERT INTO products (name, category, unit) VALUES (?, ?, ?)").run('Говядина', 'Мясо', 'кг');
  const p4 = db.prepare("INSERT INTO products (name, category, unit) VALUES (?, ?, ?)").run('Курица', 'Мясо', 'кг');
  const p5 = db.prepare("INSERT INTO products (name, category, unit) VALUES (?, ?, ?)").run('Молоко', 'Молочные продукты', 'л');

  // Insert Price Lists
  db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(s1.lastInsertRowid, p1.lastInsertRowid, 150);
  db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(s1.lastInsertRowid, p2.lastInsertRowid, 120);
  db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(s2.lastInsertRowid, p3.lastInsertRowid, 550);
  db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(s2.lastInsertRowid, p4.lastInsertRowid, 280);
  db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(s3.lastInsertRowid, p5.lastInsertRowid, 85);
  
  console.log("Database seeded successfully");
}

// Check if we need to seed
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
if (userCount === 0) {
  seedDatabase();
}

// Email Transporter Setup
// Transporter is created dynamically in sendWelcomeEmail using system settings

async function sendEmail(to: string, templateId: string, variables: Record<string, any>) {
  const settings = getSystemSettings();
  if (!settings.smtp_user) {
    console.log(`SMTP not configured. Email to ${to} with template ${templateId} not sent.`);
    console.log("Variables:", variables);
    return;
  }

  const template = db.prepare("SELECT * FROM email_templates WHERE id = ?").get(templateId) as any;
  if (!template) {
    console.error(`Email template ${templateId} not found.`);
    return;
  }

  let subject = template.subject;
  let body = template.body;

  const allVariables = { ...variables, base_url: settings.base_url };

  Object.entries(allVariables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  });

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_port === 465,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_pass,
      },
    });

    await transporter.sendMail({
      from: `"ProcureHub" <${settings.smtp_from}>`,
      to: to,
      subject: subject,
      html: body,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

async function sendWelcomeEmail(email: string, password: string) {
  await sendEmail(email, 'welcome', { password });
}

// Robokassa Payment URL Generator
function generateRobokassaUrl(invId: number, outSum: number, description: string, email: string) {
  const settings = getSystemSettings();
  const signature = crypto
    .createHash("md5")
    .update(`${settings.robokassa_login}:${outSum}:${invId}:${settings.robokassa_pass1}`)
    .digest("hex");

  const baseUrl = "https://auth.robokassa.ru/Merchant/Index.aspx";

  const params = new URLSearchParams({
    MerchantLogin: settings.robokassa_login,
    OutSum: outSum.toString(),
    InvId: invId.toString(),
    Description: description,
    SignatureValue: signature,
    Email: email,
    IsTest: settings.robokassa_test ? "1" : "0"
  });

  return `${baseUrl}?${params.toString()}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.use(cookieSession({
    name: 'session',
    keys: [getSystemSettings().session_secret],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    sameSite: 'none'
  }));

  const getOAuth2Client = () => {
    const settings = getSystemSettings();
    return new google.auth.OAuth2(
      settings.google_client_id,
      settings.google_client_secret,
      settings.google_redirect_uri || `${settings.base_url}/auth/google/callback`
    );
  };

  // Google Auth Routes
  app.get("/api/auth/google/url", (req, res) => {
    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ],
      prompt: 'consent'
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const oauth2Client = getOAuth2Client();
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      req.session!.tokens = tokens;
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Google Sheets API
  app.get("/api/google/sheets", async (req, res) => {
    if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated with Google" });
    
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    try {
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id, name)',
      });
      res.json(response.data.files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spreadsheets" });
    }
  });

  app.get("/api/google/sheets/:spreadsheetId", async (req, res) => {
    if (!req.session?.tokens) return res.status(401).json({ error: "Not authenticated with Google" });
    
    const { spreadsheetId } = req.params;
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(req.session.tokens);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetName = meta.data.sheets?.[0].properties?.title;
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z100`,
      });
      res.json({ values: response.data.values, sheetName });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sheet data" });
    }
  });

  app.get("/api/products/export", (req, res) => {
    try {
      const products = db.prepare("SELECT name, category, unit FROM products").all();
      const worksheet = xlsx.utils.json_to_sheet(products);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Products");
      
      const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=products.xlsx");
      res.send(buffer);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export products" });
    }
  });

  app.get("/api/products", (req, res) => {
    try {
      const products = db.prepare("SELECT * FROM products ORDER BY name").all();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/supplier/import", async (req, res) => {
    const { supplier_id, products } = req.body;
    try {
      const insertProduct = db.prepare("INSERT OR IGNORE INTO products (name, category, unit) VALUES (?, ?, ?)");
      const getProduct = db.prepare("SELECT id FROM products WHERE name = ?");
      const upsertPrice = db.prepare(`
        INSERT INTO price_lists (supplier_id, product_id, price, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(supplier_id, product_id) DO UPDATE SET
        price = excluded.price,
        updated_at = CURRENT_TIMESTAMP
      `);

      const transaction = db.transaction((items) => {
        for (const item of items) {
          insertProduct.run(item.name, item.category || 'Общее', item.unit || 'кг');
          const product = getProduct.get(item.name) as any;
          if (product) {
            upsertPrice.run(supplier_id, product.id, item.price);
          }
        }
      });

      transaction(products);
      res.json({ success: true });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to import products" });
    }
  });

  // Robokassa Result URL (Server-to-Server)
  app.post("/api/payments/robokassa/result", (req, res) => {
    const { OutSum, InvId, SignatureValue } = req.body;
    const settings = getSystemSettings();

    const mySignature = crypto
      .createHash("md5")
      .update(`${OutSum}:${InvId}:${settings.robokassa_pass2}`)
      .digest("hex")
      .toUpperCase();

    if (SignatureValue?.toUpperCase() === mySignature) {
      const userId = parseInt(InvId);
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const subscription = JSON.stringify({
        active: true,
        plan: 'monthly',
        expiresAt: expiresAt.toISOString()
      });

      db.prepare("UPDATE users SET subscription = ? WHERE id = ?").run(subscription, userId);
      res.send(`OK${InvId}`);
    } else {
      res.status(400).send("bad signature");
    }
  });

  app.post("/api/payments/create", (req, res) => {
    const { userId, plan } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const amount = plan === 'yearly' ? 20000 : 3000;
    const description = `Подписка RestCost: ${plan === 'yearly' ? 'Годовая' : 'Месячная'}`;
    const url = generateRobokassaUrl(user.id, amount, description, user.email || "");
    res.json({ url });
  });

  const PORT = 3000;

  app.get("/api/config/public", (req, res) => {
    const settings = getSystemSettings();
    res.json({
      base_url: settings.base_url,
      gemini_api_key: settings.gemini_api_key
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Datanewton API Proxy
  app.post("/api/datanewton/counterparty", async (req, res) => {
    const { inn } = req.body;
    const settings = getSystemSettings();

    if (!settings.datanewton_api_key) {
      return res.status(500).json({ error: "Datanewton API key not configured" });
    }

    if (!inn) {
      return res.status(400).json({ error: "ИНН обязателен" });
    }

    try {
      const cleanInn = String(inn).trim();
      
      // Function to fetch with retry on 409 Conflict
      const fetchWithRetry = async (retries = 2): Promise<any> => {
        try {
          // Minimal parameters often work better to avoid 409 Conflict
          const url = `https://api.datanewton.ru/v1/counterparty?inn=${cleanInn}&key=${settings.datanewton_api_key}`;
          console.log("Requesting Datanewton API:", url.replace(settings.datanewton_api_key || "", "HIDDEN"));
          return await axios.get(url);
        } catch (err: any) {
          // 409 Conflict often means the server is busy processing this INN, a retry usually helps
          if (err.response?.status === 409 && retries > 0) {
            console.log(`Datanewton 409 Conflict for ${cleanInn}, retrying in 2s... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return fetchWithRetry(retries - 1);
          }
          throw err;
        }
      };

      const response = await fetchWithRetry();

      const result = response.data;
      console.log("Datanewton API Response for INN", cleanInn, ":", JSON.stringify(result, null, 2));

      // Check if we have any business data (company or individual/IP)
      if (!result || (!result.company && !result.individual)) {
        // If it's a self-employed person, the API might return basic info or nothing
        const topLevelName = result.fio || result.name;
        if (topLevelName && typeof topLevelName === 'string') {
          return res.json({ ...result, name: topLevelName });
        }
        return res.status(404).json({ error: "Организация или ИП не найдены. Убедитесь, что ИНН принадлежит юридическому лицу или ИП." });
      }

      // Extract name from company or individual based on provided structure
      let name = "Организация найдена";
      
      if (result.company) {
        const c = result.company;
        const names = c.company_names || c.name;
        if (names) {
          name = names.short || 
                 names.full || 
                 names.short_name || 
                 names.full_name || 
                 (typeof names === 'string' ? names : name);
        }
      } else if (result.individual) {
        const i = result.individual;
        // For individuals, the field is 'fio' according to the documentation provided
        name = i.fio || 
               i.name?.full || 
               i.name?.short || 
               i.full_name || 
               i.short_name || 
               (typeof i.name === 'string' ? i.name : name);
      }

      res.json({ ...result, name });
    } catch (err: any) {
      const errorData = err.response?.data;
      const statusCode = err.response?.status;
      console.error("Datanewton API error:", {
        status: statusCode,
        data: errorData,
        message: err.message,
        inn: inn
      });
      res.status(500).json({ error: "Ошибка при получении данных об организации" });
    }
  });

  // Auth / Registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { inn, name, type, email } = req.body;
      
      if (!inn || !name || !type || !email) {
        return res.status(400).json({ error: "Все поля обязательны для заполнения" });
      }

      const password = Math.random().toString(36).slice(-8); // Generate random 8-char password
      
      try {
        const info = db.prepare("INSERT INTO users (inn, name, type, email, password, settings) VALUES (?, ?, ?, ?, ?, ?)").run(inn, name, type, email, password, JSON.stringify({}));
        await sendWelcomeEmail(email, password);
        res.json({ id: info.lastInsertRowid, inn, name, type, email, settings: {} });
      } catch (e: any) {
        console.error("Registration error:", e);
        const user = db.prepare("SELECT * FROM users WHERE inn = ?").get(inn);
        if (user) {
          res.status(400).json({ error: "Пользователь с таким ИНН уже существует. Пожалуйста, войдите." });
        } else {
          res.status(500).json({ error: `Ошибка регистрации: ${e.message}` });
        }
      }
    } catch (err: any) {
      console.error("Auth register error:", err);
      res.status(500).json({ error: "Ошибка при регистрации" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      if (!user) {
        return res.status(404).json({ error: "Пользователь с таким email не найден" });
      }

      const newPassword = Math.random().toString(36).slice(-8);
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, user.id);

      await sendEmail(email, 'password_reset', { password: newPassword });

      res.json({ success: true, message: "Новый пароль отправлен на вашу почту" });
    } catch (err) {
      res.status(500).json({ error: "Ошибка при восстановлении пароля" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { inn, password } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE inn = ? AND password = ?").get(inn, password) as any;
      if (user) {
        db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);
        if (user.settings) {
          user.settings = JSON.parse(user.settings);
        }
        if (user.subscription) {
          user.subscription = JSON.parse(user.subscription);
        }
        res.json(user);
      } else {
        res.status(401).json({ error: "Неверный ИНН или пароль" });
      }
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Ошибка при входе в систему" });
    }
  });

  // Get Suppliers and Prices
  app.get("/api/prices", (req, res) => {
    try {
      const prices = db.prepare(`
        SELECT p.name as product_name, u.name as supplier_name, pl.price, pl.updated_at, p.category
        FROM price_lists pl
        JOIN products p ON pl.product_id = p.id
        JOIN users u ON pl.supplier_id = u.id
        ORDER BY p.name, pl.price ASC
      `).all();
      res.json(prices);
    } catch (err) {
      console.error("Error fetching prices:", err);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  app.get("/api/suppliers", (req, res) => {
    try {
      const suppliers = db.prepare("SELECT id, name, inn, email FROM users WHERE type = 'supplier'").all();
      const enrichedSuppliers = suppliers.map(s => {
        const categories = db.prepare(`
          SELECT DISTINCT p.category 
          FROM price_lists pl 
          JOIN products p ON pl.product_id = p.id 
          WHERE pl.supplier_id = ?
        `).all(s.id).map(c => c.category);
        
        return {
          ...s,
          rating: (4 + Math.random() * 0.9).toFixed(1),
          description: "Надежный поставщик качественных продуктов для HoReCa. Работаем на рынке более 10 лет.",
          categories
        };
      });
      res.json(enrichedSuppliers);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/suppliers/:id", (req, res) => {
    const { id } = req.params;
    try {
      const supplier = db.prepare("SELECT id, name, inn, email FROM users WHERE id = ? AND type = 'supplier'").get(id);
      if (!supplier) return res.status(404).json({ error: "Supplier not found" });

      const prices = db.prepare(`
        SELECT p.name as product_name, p.category, pl.price, p.unit, pl.updated_at
        FROM price_lists pl
        JOIN products p ON pl.product_id = p.id
        WHERE pl.supplier_id = ?
      `).all(id);

      res.json({
        ...supplier,
        rating: "4.8",
        description: "Надежный поставщик качественных продуктов для HoReCa. Работаем на рынке более 10 лет. Собственная логистика и контроль качества.",
        prices
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch supplier details" });
    }
  });

  // Seed data if empty
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  if (userCount === 0) {
    // Users
    db.prepare("INSERT INTO users (inn, name, type, email, password) VALUES (?, ?, ?, ?, ?)").run("7701010101", "Ресторан 'Гурман'", "restaurant", "lgm.grey@gmail.com", "123456");
    db.prepare("INSERT INTO users (inn, name, type, password) VALUES (?, ?, ?, ?)").run("7702020202", "Овощи-Фрукты Опт", "supplier", "123456");
    db.prepare("INSERT INTO users (inn, name, type, password) VALUES (?, ?, ?, ?)").run("7703030303", "Мясной Двор", "supplier", "123456");
    db.prepare("INSERT INTO users (inn, name, type, password) VALUES (?, ?, ?, ?)").run("7704040404", "Мир Специй", "supplier", "123456");
    db.prepare("INSERT INTO users (inn, name, type, password) VALUES (?, ?, ?, ?)").run("7705050505", "Молочная Ферма", "supplier", "123456");
    db.prepare("INSERT INTO users (inn, name, type, password) VALUES (?, ?, ?, ?)").run("7706060606", "Рыбный Порт", "supplier", "123456");
    db.prepare("INSERT INTO users (inn, name, type, password) VALUES (?, ?, ?, ?)").run("0000000000", "Администратор", "admin", "admin");

    // Products
    const products = [
      ["Помидоры Черри", "Овощи", "кг"],
      ["Огурцы длинноплодные", "Овощи", "кг"],
      ["Картофель молодой", "Овощи", "кг"],
      ["Лук репчатый", "Овощи", "кг"],
      ["Говядина вырезка", "Мясо", "кг"],
      ["Свиная шея", "Мясо", "кг"],
      ["Куриное филе", "Мясо", "кг"],
      ["Молоко 3.2%", "Молочные продукты", "л"],
      ["Сливки 33%", "Молочные продукты", "л"],
      ["Сыр Пармезан", "Молочные продукты", "кг"],
      ["Масло сливочное 82.5%", "Молочные продукты", "кг"],
      ["Масло оливковое Extra Virgin", "Бакалея", "л"],
      ["Мука пшеничная в/с", "Бакалея", "кг"],
      ["Сахар песок", "Бакалея", "кг"],
      ["Соль морская", "Бакалея", "кг"],
      ["Лосось филе", "Рыба", "кг"],
      ["Креветки тигровые", "Рыба", "кг"],
      ["Перец черный горошек", "Специи", "кг"],
      ["Паприка копченая", "Специи", "кг"]
    ];
    const insertProduct = db.prepare("INSERT INTO products (name, category, unit) VALUES (?, ?, ?)");
    products.forEach(p => insertProduct.run(p[0], p[1], p[2]));

    // Price Lists (Supplier IDs: 2-6)
    // Supplier 2: Овощи-Фрукты Опт
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(2, 1, 250);
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(2, 2, 120);
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(2, 3, 45);
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(2, 4, 35);

    // Supplier 3: Мясной Двор
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(3, 5, 950);
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(3, 6, 450);
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(3, 7, 320);

    // Supplier 4: Мир Специй
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(4, 18, 1200);
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(4, 19, 850);
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(4, 12, 750);

    // Supplier 5: Молочная Ферма
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(5, 8, 85);
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(5, 9, 380);
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(5, 10, 1400);
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(5, 11, 720);

    // Supplier 6: Рыбный Порт
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(6, 16, 1800);
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(6, 17, 1200);

    // Competitive prices for analysis
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(2, 5, 920); // Supplier 2 also has meat, but cheaper
    db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(3, 1, 240); // Supplier 3 has tomatoes cheaper

    // Invoices
    db.prepare("INSERT INTO invoices (restaurant_id, supplier_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?)").run(1, 2, 15400, "approved", "2026-02-15T10:00:00Z");
    db.prepare("INSERT INTO invoices (restaurant_id, supplier_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?)").run(1, 3, 42000, "approved", "2026-02-18T14:30:00Z");
    db.prepare("INSERT INTO invoices (restaurant_id, supplier_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?)").run(1, 5, 8900, "pending", "2026-03-01T09:15:00Z");
    db.prepare("INSERT INTO invoices (restaurant_id, supplier_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?)").run(1, 4, 3200, "approved", "2026-02-25T11:45:00Z");

    // Messages - Clear and re-seed to ensure demo data is present
    db.prepare("DELETE FROM messages").run();
    
    const demoMessages = [
      [2, 1, "Здравствуйте! Ваш заказ на овощи принят.", "2026-03-01T10:00:00Z"],
      [1, 2, "Спасибо, ждем доставку к 8 утра.", "2026-03-01T10:05:00Z"],
      [2, 1, "Машина выехала, будет через 20 минут.", "2026-03-06T08:00:00Z"],
      [1, 2, "Принял, ворота открыты.", "2026-03-06T08:05:00Z"],
      [3, 1, "У нас новое поступление мраморной говядины.", "2026-03-02T15:00:00Z"],
      [1, 3, "Пришлите, пожалуйста, прайс на вырезку.", "2026-03-02T15:10:00Z"],
      [3, 1, "Прайс отправил на почту. Цены на этой неделе стабильные.", "2026-03-06T09:30:00Z"],
      [1, 3, "Вижу, спасибо. Сформирую заказ к вечеру.", "2026-03-06T09:45:00Z"],
      [5, 1, "Свежее молоко и сыры уже в пути!", "2026-03-03T09:00:00Z"],
      [1, 5, "Отлично, спасибо за оперативность.", "2026-03-03T09:15:00Z"],
      [5, 1, "Завтра будет задержка по поставке творога, извините.", "2026-03-06T10:00:00Z"],
      [1, 5, "Ничего страшного, у нас есть запас.", "2026-03-06T10:10:00Z"],
      [4, 1, "Заказ на специи подтвержден.", "2026-03-04T11:00:00Z"],
      [1, 4, "Когда ожидать курьера?", "2026-03-06T11:00:00Z"],
      [4, 1, "Курьер будет у вас в течение часа.", "2026-03-06T11:15:00Z"],
      [6, 1, "Добрый день! По рыбе сегодня есть отличный сибас.", "2026-03-06T11:30:00Z"],
      [1, 6, "Какая цена за кг?", "2026-03-06T11:45:00Z"],
      [6, 1, "Для вас сделаем по 1200 ₽.", "2026-03-06T12:00:00Z"]
    ];

    const insertMsg = db.prepare("INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?)");
    demoMessages.forEach(msg => insertMsg.run(...msg));
  } else {
    // Ensure admin exists even if DB was already seeded
    const admin = db.prepare("SELECT * FROM users WHERE inn = ?").get("0000000000");
    if (!admin) {
      db.prepare("INSERT INTO users (inn, name, type, password) VALUES (?, ?, ?, ?)").run("0000000000", "Администратор", "admin", "admin");
    }
  }

  // User Profile API
  app.patch("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { name, email, settings, subscription } = req.body;
    try {
      if (subscription) {
        db.prepare("UPDATE users SET name = ?, email = ?, settings = ?, subscription = ? WHERE id = ?").run(name, email, JSON.stringify(settings), JSON.stringify(subscription), id);
      } else {
        db.prepare("UPDATE users SET name = ?, email = ?, settings = ? WHERE id = ?").run(name, email, JSON.stringify(settings), id);
      }
      const updatedUser = db.prepare("SELECT id, inn, name, type, email, settings, subscription FROM users WHERE id = ?").get(id);
      if (updatedUser) {
        if (updatedUser.settings) updatedUser.settings = JSON.parse(updatedUser.settings);
        if (updatedUser.subscription) updatedUser.subscription = JSON.parse(updatedUser.subscription);
      }
      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Payment / Subscription API
  app.post("/api/subscription/pay", (req, res) => {
    const { userId, plan } = req.body;
    try {
      const expiresAt = new Date();
      if (plan === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      const subscription = {
        active: true,
        plan,
        expiresAt: expiresAt.toISOString()
      };

      db.prepare("UPDATE users SET subscription = ? WHERE id = ?").run(JSON.stringify(subscription), userId);
      
      const updatedUser = db.prepare("SELECT id, inn, name, type, email, settings, subscription FROM users WHERE id = ?").get(userId);
      if (updatedUser) {
        if (updatedUser.settings) updatedUser.settings = JSON.parse(updatedUser.settings);
        if (updatedUser.subscription) updatedUser.subscription = JSON.parse(updatedUser.subscription);
      }
      
      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ error: "Ошибка при обработке оплаты" });
    }
  });

  // Supplier Product Management
  app.get("/api/supplier/:id/prices", (req, res) => {
    const { id } = req.params;
    try {
      const prices = db.prepare(`
        SELECT pl.id, p.name as product_name, p.category, pl.price, p.unit, pl.updated_at, p.id as product_id
        FROM price_lists pl
        JOIN products p ON pl.product_id = p.id
        WHERE pl.supplier_id = ?
      `).all(id);
      res.json(prices);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch supplier prices" });
    }
  });

  app.post("/api/supplier/prices", (req, res) => {
    const { supplier_id, product_name, category, price, unit } = req.body;
    try {
      // 1. Find or create product
      let product = db.prepare("SELECT id FROM products WHERE name = ?").get(product_name);
      let productId;
      
      if (!product) {
        const info = db.prepare("INSERT INTO products (name, category, unit) VALUES (?, ?, ?)").run(product_name, category, unit);
        productId = info.lastInsertRowid;
      } else {
        productId = product.id;
      }

      // 2. Add or update price list
      const existingPrice = db.prepare("SELECT id FROM price_lists WHERE supplier_id = ? AND product_id = ?").get(supplier_id, productId);
      
      if (existingPrice) {
        db.prepare("UPDATE price_lists SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(price, existingPrice.id);
        res.json({ success: true, message: "Price updated" });
      } else {
        db.prepare("INSERT INTO price_lists (supplier_id, product_id, price) VALUES (?, ?, ?)").run(supplier_id, productId, price);
        res.json({ success: true, message: "Product added to price list" });
      }
    } catch (err) {
      console.error("Add price error:", err);
      res.status(500).json({ error: "Failed to add product" });
    }
  });

  app.delete("/api/supplier/prices/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM price_lists WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete product from price list" });
    }
  });

  // Messaging API
  app.get("/api/conversations/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      // Check if user has any messages. If not, seed some demo ones for them.
      const hasMessages = db.prepare("SELECT 1 FROM messages WHERE sender_id = ? OR receiver_id = ? LIMIT 1").get(userId, userId);
      
      if (!hasMessages) {
        // Seed some initial messages from suppliers (IDs 2-6) to this user
        const suppliers = [2, 3, 4, 5, 6];
        const welcomeMsgs = [
          "Здравствуйте! Мы готовы к сотрудничеству. Посмотрите наш актуальный прайс-лист.",
          "Добрый день! У нас сегодня отличные предложения по сезонным продуктам.",
          "Приветствуем! Мы обновили ассортимент. Есть ли у вас потребность в поставках на этой неделе?",
          "Здравствуйте! Напоминаем о возможности предзаказа со скидкой 5%.",
          "Добрый день! Как ваши дела? Готовы обсудить индивидуальные условия поставок."
        ];
        
        suppliers.forEach((sId, idx) => {
          db.prepare("INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?)")
            .run(sId, userId, welcomeMsgs[idx], new Date(Date.now() - (idx * 3600000)).toISOString());
        });
      }

      // Improved query to get unique conversations with the latest message
      const conversations = db.prepare(`
        SELECT 
          u.id, 
          u.name, 
          u.type,
          m.content as last_message,
          m.created_at as last_message_time
        FROM users u
        JOIN (
          SELECT 
            CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as contact_id,
            content,
            created_at,
            ROW_NUMBER() OVER (
              PARTITION BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END 
              ORDER BY created_at DESC
            ) as rn
          FROM messages
          WHERE sender_id = ? OR receiver_id = ?
        ) m ON u.id = m.contact_id
        WHERE m.rn = 1 AND u.id != ?
        ORDER BY m.created_at DESC
      `).all(userId, userId, userId, userId, userId);
      res.json(conversations);
    } catch (err) {
      console.error("Conversations error:", err);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:userId/:otherId", (req, res) => {
    const { userId, otherId } = req.params;
    try {
      const messages = db.prepare(`
        SELECT m.*, u.name as sender_name 
        FROM messages m 
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
      `).all(userId, otherId, otherId, userId);
      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", (req, res) => {
    const { sender_id, receiver_id, content } = req.body;
    try {
      const info = db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)").run(sender_id, receiver_id, content);
      res.json({ id: info.lastInsertRowid, sender_id, receiver_id, content, created_at: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Invoices API
  app.get("/api/invoices/:restaurantId", (req, res) => {
    const { restaurantId } = req.params;
    try {
      const invoices = db.prepare("SELECT * FROM invoices WHERE restaurant_id = ?").all(restaurantId);
      res.json(invoices);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", (req, res) => {
    const { restaurant_id, supplier_id, amount, image_url } = req.body;
    try {
      const info = db.prepare("INSERT INTO invoices (restaurant_id, supplier_id, amount, image_url, status) VALUES (?, ?, ?, ?, ?)").run(restaurant_id, supplier_id, amount, image_url, 'pending');
      res.json({ id: info.lastInsertRowid, restaurant_id, supplier_id, amount, image_url, status: 'pending', created_at: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // Admin API
  app.get("/api/admin/settings", (req, res) => {
    const settings = getSystemSettings();
    res.json(settings);
  });

  app.post("/api/admin/settings", (req, res) => {
    const { 
      robokassa_login, robokassa_pass1, robokassa_pass2, robokassa_test, 
      datanewton_api_key, smtp_host, smtp_port, smtp_user, smtp_pass, base_url,
      google_client_id, google_client_secret, google_redirect_uri, session_secret, gemini_api_key,
      smtp_from
    } = req.body;

    try {
      db.prepare(`
        UPDATE system_settings SET 
          robokassa_login = ?, 
          robokassa_pass1 = ?, 
          robokassa_pass2 = ?, 
          robokassa_test = ?, 
          datanewton_api_key = ?,
          smtp_host = ?,
          smtp_port = ?,
          smtp_user = ?,
          smtp_pass = ?,
          base_url = ?,
          google_client_id = ?,
          google_client_secret = ?,
          google_redirect_uri = ?,
          session_secret = ?,
          gemini_api_key = ?,
          smtp_from = ?
        WHERE id = 1
      `).run(
        robokassa_login, 
        robokassa_pass1, 
        robokassa_pass2, 
        robokassa_test ? 1 : 0, 
        datanewton_api_key,
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_pass,
        base_url,
        google_client_id,
        google_client_secret,
        google_redirect_uri,
        session_secret,
        gemini_api_key,
        smtp_from
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Update settings error:", err);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/admin/email-templates", (req, res) => {
    try {
      const templates = db.prepare("SELECT * FROM email_templates").all();
      res.json(templates);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/admin/email-templates", (req, res) => {
    const { id, subject, body } = req.body;
    try {
      db.prepare("UPDATE email_templates SET subject = ?, body = ? WHERE id = ?").run(subject, body, id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.get("/api/users/by-inn/:inn", (req, res) => {
    const { inn } = req.params;
    try {
      const user = db.prepare("SELECT id, email FROM users WHERE inn = ?").get(inn);
      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/admin/users", (req, res) => {
    try {
      const users = db.prepare("SELECT * FROM users").all();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", (req, res) => {
    const { id } = req.params;
    const { name, email, inn, type, subscription } = req.body;
    
    try {
      db.prepare("UPDATE users SET name = ?, email = ?, inn = ?, type = ?, subscription = ? WHERE id = ?")
        .run(name, email, inn, type, typeof subscription === 'string' ? subscription : JSON.stringify(subscription), id);
      
      const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      res.json(updatedUser);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/admin/users/:id/subscription", (req, res) => {
    const { id } = req.params;
    const { subscription } = req.body;
    try {
      db.prepare("UPDATE users SET subscription = ? WHERE id = ?").run(JSON.stringify(subscription), id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  app.get("/api/admin/stats", (req, res) => {
    try {
      const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
      const invoiceCount = db.prepare("SELECT COUNT(*) as count FROM invoices").get().count;
      const messageCount = db.prepare("SELECT COUNT(*) as count FROM messages").get().count;
      const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
      const totalVolume = db.prepare("SELECT SUM(amount) as total FROM invoices").get().total || 0;
      res.json({ userCount, invoiceCount, messageCount, orderCount, totalVolume });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.delete("/api/admin/users/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/admin/invoices", (req, res) => {
    try {
      const invoices = db.prepare(`
        SELECT i.*, r.name as restaurant_name, s.name as supplier_name 
        FROM invoices i
        JOIN users r ON i.restaurant_id = r.id
        JOIN users s ON i.supplier_id = s.id
        ORDER BY i.created_at DESC
      `).all();
      res.json(invoices);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.patch("/api/admin/invoices/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      db.prepare("UPDATE invoices SET status = ? WHERE id = ?").run(status, id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  app.get("/api/admin/prices", (req, res) => {
    try {
      const prices = db.prepare(`
        SELECT pl.id, p.name as product_name, p.category, u.name as supplier_name, pl.price, pl.updated_at
        FROM price_lists pl
        JOIN products p ON pl.product_id = p.id
        JOIN users u ON pl.supplier_id = u.id
        ORDER BY pl.updated_at DESC
      `).all();
      res.json(prices);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  app.delete("/api/admin/prices/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM price_lists WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete price" });
    }
  });

  // iiko Integration API
  app.post("/api/integrations/iiko/connect", async (req, res) => {
    const { userId, apiLogin } = req.body;
    try {
      // 1. Get Access Token from iiko
      const authResponse = await axios.post("https://api-ru.iiko.services/api/1/access_token", {
        apiLogin
      });
      const token = authResponse.data.token;

      // 2. Get Organizations
      const orgResponse = await axios.post("https://api-ru.iiko.services/api/1/organizations", {
        organizationIds: null,
        returnAdditionalInfo: false,
        includeDisabled: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const organizations = orgResponse.data.organizations;
      if (!organizations || organizations.length === 0) {
        return res.status(404).json({ error: "Организации не найдены в iiko" });
      }

      // Store integration (using first organization for demo)
      const orgId = organizations[0].id;
      db.prepare("INSERT OR REPLACE INTO integrations (user_id, type, api_login, organization_id) VALUES (?, ?, ?, ?)").run(userId, 'iiko', apiLogin, orgId);

      res.json({ success: true, organization: organizations[0] });
    } catch (err: any) {
      console.error("iiko connection error:", err.response?.data || err.message);
      res.status(500).json({ error: "Ошибка подключения к iiko. Проверьте apiLogin." });
    }
  });

  app.post("/api/integrations/1c/connect", (req, res) => {
    const { userId, serverUrl, login, password } = req.body;
    try {
      // Mock validation for 1C
      if (!serverUrl || !login || !password) {
        return res.status(400).json({ error: "Все поля обязательны" });
      }

      // Store integration
      db.prepare("INSERT OR REPLACE INTO integrations (user_id, type, api_login, organization_id) VALUES (?, ?, ?, ?)").run(
        userId, 
        '1c', 
        login, 
        serverUrl // Store URL in organization_id field for simplicity in this demo
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Ошибка при сохранении настроек 1С" });
    }
  });

  app.get("/api/integrations/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const integration = db.prepare("SELECT * FROM integrations WHERE user_id = ?").get(userId);
      res.json(integration || null);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch integration" });
    }
  });

  app.post("/api/integrations/iiko/sync", async (req, res) => {
    const { userId } = req.body;
    try {
      const integration = db.prepare("SELECT * FROM integrations WHERE user_id = ? AND type = 'iiko'").get(userId);
      if (!integration) return res.status(404).json({ error: "Интеграция не настроена" });

      // 1. Get Access Token
      const authResponse = await axios.post("https://api-ru.iiko.services/api/1/access_token", {
        apiLogin: integration.api_login
      });
      const token = authResponse.data.token;

      // 2. Get Nomenclature
      const nomResponse = await axios.post("https://api-ru.iiko.services/api/1/nomenclature", {
        organizationId: integration.organization_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const products = nomResponse.data.products; // iiko nomenclature products
      
      // 3. Sync to local products table
      const insertProduct = db.prepare("INSERT OR IGNORE INTO products (name, category, unit) VALUES (?, ?, ?)");
      let count = 0;
      products.forEach((p: any) => {
        if (p.type === 'Product') {
          insertProduct.run(p.name, p.parentGroup || 'Без категории', p.measureUnit || 'шт');
          count++;
        }
      });

      db.prepare("UPDATE integrations SET last_sync = CURRENT_TIMESTAMP WHERE id = ?").run(integration.id);

      res.json({ success: true, count });
    } catch (err: any) {
      console.error("iiko sync error:", err.response?.data || err.message);
      res.status(500).json({ error: "Ошибка синхронизации с iiko" });
    }
  });

  // Orders API
  app.post("/api/orders", (req, res) => {
    const { restaurant_id, supplier_id, items, total } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO orders (restaurant_id, supplier_id, items, total)
        VALUES (?, ?, ?, ?)
      `).run(restaurant_id, supplier_id, JSON.stringify(items), total);
      const orderId = info.lastInsertRowid;

      // Notify restaurant
      const restaurant = db.prepare("SELECT email FROM users WHERE id = ?").get(restaurant_id) as any;
      if (restaurant?.email) {
        sendEmail(restaurant.email, 'order_created', { order_id: orderId, total });
      }

      // Notify supplier
      const supplier = db.prepare("SELECT email FROM users WHERE id = ?").get(supplier_id) as any;
      if (supplier?.email) {
        sendEmail(supplier.email, 'order_created', { order_id: orderId, total });
      }

      res.json({ id: orderId, success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders/supplier/:id", (req, res) => {
    const { id } = req.params;
    try {
      const orders = db.prepare(`
        SELECT o.*, u.name as restaurant
        FROM orders o
        JOIN users u ON o.restaurant_id = u.id
        WHERE o.supplier_id = ?
        ORDER BY o.created_at DESC
      `).all(id);
      res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items) })));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch supplier orders" });
    }
  });

  app.get("/api/orders/restaurant/:id", (req, res) => {
    const { id } = req.params;
    try {
      const orders = db.prepare(`
        SELECT o.*, u.name as supplier
        FROM orders o
        JOIN users u ON o.supplier_id = u.id
        WHERE o.restaurant_id = ?
        ORDER BY o.created_at DESC
      `).all(id);
      res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items) })));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch restaurant orders" });
    }
  });

  app.patch("/api/orders/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.get("/api/supplier/:id/stats", (req, res) => {
    const { id } = req.params;
    try {
      const productCount = db.prepare("SELECT COUNT(*) as count FROM price_lists WHERE supplier_id = ?").get(id).count;
      const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders WHERE supplier_id = ?").get(id).count;
      const totalVolume = db.prepare("SELECT SUM(total) as total FROM orders WHERE supplier_id = ?").get(id).total || 0;
      res.json({ productCount, orderCount, totalVolume });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch supplier stats" });
    }
  });

  // Vite middleware for development (MUST BE AT THE END)
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    console.log("Starting in DEVELOPMENT mode with Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode");
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
