const mysql = require('mysql2/promise'); // Assuming you're using mysql2
require("dotenv").config({ path: "../Secrets/secrets.env" });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const execute = async (query, params) => {
    const [rows] = await pool.execute(query, params);
    return rows;
};

module.exports = { execute };