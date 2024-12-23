const mysql = require('mysql2/promise');
const dbConnection = require("./DB_Conn");
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

const executeAddUser = async (platform, psa, asideId) => {
    const insertAccountQuery = `
        INSERT INTO Accounts (Platform, PSA, Role)
        VALUES (?, ?, 'User');
    `;
    const params = [platform, psa, 'User'];
    const [insertResult] = await pool.execute(insertAccountQuery, params);
    const userId = insertResult.insertId; // Get the inserted ID directly

    const insertUserAsideQuery = `
        INSERT INTO UserAside (UserID, AsideID)
        VALUES (?, ?);
    `;
    await pool.execute(insertUserAsideQuery, [userId, asideId]);

    return { userId }; // Optionally return the user ID
};

const executeRemoveUser = async (psa, asideId) => {
    const removeUser = `
        DELETE ua, a
        FROM UserAside ua
        JOIN Accounts a ON ua.UserID = a.UserID
        WHERE a.PSA = ? AND ua.AsideID = ? AND a.ROLE != 'Admin';
    `;

    try {
        const params = [psa, asideId];
        const [result] = await pool.execute(removeUser, params);

        return result.affectedRows; // num of affected rows
    } catch (error) {
        console.error("Error removing user:", error);
        throw error; // Propagate the error to be handled by the caller
    }
};



module.exports = { execute, executeAddUser, executeRemoveUser };