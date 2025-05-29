// db.js
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'daeho',
  password: '1234',
  database: 'user_db',
  waitForConnections: true,
  connectionLimit: 10
});
module.exports = pool;