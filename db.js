const mysql = require('mysql2');

// Maak een connectiepool aan naar jouw lokale MySQL database
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'WJ28@khrps', // ✅ UPDATE: Use the correct MySQL password
    database: process.env.DB_NAME || 'switirit_db',        // De database uit je EER-diagram
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exporteer de pool met promise-ondersteuning (zodat async/await werkt in server.js)
module.exports = pool.promise();