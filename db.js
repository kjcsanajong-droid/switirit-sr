const mysql = require('mysql2');

// Maak een connectiepool aan naar jouw lokale MySQL database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'P@$$w0rd@2025', // ✅ UPDATE: Use the correct MySQL password
    database: 'switirit_db',        // De database uit je EER-diagram
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exporteer de pool met promise-ondersteuning (zodat async/await werkt in server.js)
module.exports = pool.promise();