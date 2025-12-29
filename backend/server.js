const express = require("express");
const mysql = require("mysql2");
const path = require("path");
require("dotenv").config();
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const VERCEL_URL = "https://ctf-website-ten.vercel.app/";

app.use(
  cors({
    origin: VERCEL_URL,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ OPTIMIZED FOR FREE PLAN (20 connections max)
// Use VERY small pool to avoid exhausting connections
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 25060,
  user: process.env.DB_USER || "ctfuser",
  password: process.env.DB_PASS || "ctfpass",
  database: process.env.DB_NAME || "ctfdbs",
  waitForConnections: true,
  connectionLimit: 14, // 14 connections (leaving 6 as buffer from 20 max)
  queueLimit: 200, // Queue up to 200 waiting requests
  acquireTimeout: 30000, // Wait 30s for connection
  connectTimeout: 60000,
  multipleStatements: true,
  ssl: {
    rejectUnauthorized: false,
  },
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test the pool connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("DB pool connection error", err);
    console.error("Connection details:", {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 25060,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
    });
  } else {
    console.log("Connected to MySQL pool (optimized for free tier)");
    connection.release();
  }
});

// Handle pool errors
db.on("error", (err) => {
  console.error("Database pool error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.error(
      "Database connection lost. Pool will reconnect automatically."
    );
  }
});

// Home route
app.get("/", (req, res) => {
  res.redirect(VERCEL_URL);
});

// Login endpoint - OPTIMIZED to release connection quickly
app.get("/login", (req, res) => {
  const user = req.query.user || "";
  const pass = req.query.pass || "";

  if (!user && !pass) {
    return res.redirect(`${VERCEL_URL}/login.html`);
  }

  // vulnerable SQL - intentional
  const sql = `SELECT * FROM users WHERE username='${user}' AND password='${pass}' LIMIT 1`;

  // Query executes and IMMEDIATELY releases connection back to pool
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Login query error:", err);
      return res.send(`
        <html>
          <body>
            <p>Error occurred: ${err.message}</p>
            <a href="${VERCEL_URL}/login.html">Back to login</a>
          </body>
        </html>
      `);
    }

    if (results && results.length > 0) {
      res.send(`
        <p>Welcome ${results[0].username}</p>
        <p>Try <a href="${VERCEL_URL}/profile.html">profile</a></p>
      `);
    } else {
      res.send(`
        <p>Invalid login. Try again.</p>
        <p>The truth whispers not in what you see, but in what the code remembers.</p>
        <a href="${VERCEL_URL}/login.html">Back to login</a>
      `);
    }
  });
});

// Search endpoint - OPTIMIZED to release connection quickly
app.get("/search", (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Search</title>
      </head>
      <body>
        <h1>Search Endpoint</h1>
        <p>This endpoint searches for tokens by ID.</p>
        <hr>
        <p><b>Hint:</b> Seek the origin, where every number bows — the lone stands as <strong>one</strong>.</p>
      </body>
      </html>
    `);
  }

  const sql = `SELECT id, message, token FROM tokens WHERE id='${q}'`;

  // Query executes and IMMEDIATELY releases connection back to pool
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Search query error:", err);
      return res.send("Error occurred: " + err.message);
    }

    if (results.length === 0) {
      return res.send("No results for " + q);
    }

    res.json(results);
  });
});

app.listen(PORT, "0.0.0.0", () => console.log("Server running on " + PORT));
