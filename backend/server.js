const express = require('express');
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config();
const cors = require('cors');


const app = express();
const PORT = process.env.PORT||5000;

const VERCEL_URL = "https://ctf-website-ten.vercel.app/";

app.use(
  cors({
    origin: VERCEL_URL,
  })
);
app.use(express.json());
app.use(express.urlencoded({extended:true}));



// connect to MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 25060, // Aiven typically uses 25060, not 3306
  user: process.env.DB_USER || "ctfuser",
  password: process.env.DB_PASS || "ctfpass",
  database: process.env.DB_NAME || "ctfdbs",
  connectTimeout: 60000, // 60 seconds timeout
  multipleStatements: true,
  ssl: {
    rejectUnauthorized: false, // Required for Aiven
  }
});

db.connect((err) => {
  if (err) {
    console.error("DB conn error", err);
    console.error("Connection details:", {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 25060,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
    });
  } else {
    console.log("Connected to MySQL");
  }
});



// Serve login page (GET)
app.get('/login', (req,res)=>{
  const user = req.query.user||'';
  const pass = req.query.pass||'';
  if(!user && !pass) return res.redirect(`${VERCEL_URL}/login.html`);


  // vulnerable SQL - intentional
  const sql = `SELECT * FROM users WHERE username='${user}' AND password='${pass}' LIMIT 1`;
  db.query(sql, (err, results)=>{
    if(err) return res.send(`
      <html>
        <body>
          <p>Error occurred </p>
          <a href = "${VERCEL_URL}/login.html">Back to login</a>
        </body>
      </html>
    `);

    if(results && results.length>0){
      res.send(`
         <p>Welcome ${results[0].username}</p>
         <p>Try <a href="${VERCEL_URL}/profile.html">profile</a></p>'
      `);
    } else {
      res.send(`<p>Invalid login. Try again.</p><p>Hint: test injection at /search</p>
      <a href="${VERCEL_URL}/login.html">Back to login</a>`);
    }
  });
});

// vulnerable search endpoint - shows DB rows (intentionally vulnerable to UNION)
app.get('/search', (req,res)=>{
  const q = req.query.q || '';
  const sql = `SELECT id, message, token FROM tokens WHERE message='${q}'`;
  db.query(sql, (err, results)=>{
    if(err) return res.send('Error occurred: '+err.message);
    if(results.length===0) return res.send('No results for '+q);
    res.json(results);
  });
});

// profile - shows keystone if cookie 'role' is 'admin'

//check that the same work is also done by profile javascript code then why this
app.get('/profile', (req,res)=>{
  const role = (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('role='));
  const roleVal = role ? role.split('=')[1] : '';
  if(roleVal==='admin'){
    res.sendFile(path.join(__dirname,'..','static','profile.html'));
  } else {
    res.sendFile(path.join(__dirname,'..','static','profile.html'));
  }
});

app.listen(PORT, '0.0.0.0', ()=> console.log('Server running on '+PORT));