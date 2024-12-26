const mysql = require("mysql2/promise");
require("dotenv").config({ path: '../Secrets/secrets.env' });

// Create a pool for better connection management

const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

const queryDatabase = async (query, params) => {
    try {
        const connection = await dbPool.getConnection();
        const [rows] = await connection.query(query, params);
        connection.release();
        return rows;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

const getAllAsidesOfUser = async (userId) => {
    const query = `
        SELECT Aside.AsideID, Aside.asideName
        FROM Aside
        JOIN UserAside ON Aside.AsideID = UserAside.AsideID
        JOIN Accounts ON UserAside.userID = Accounts.userID
        WHERE Accounts.userId = ?;
    `;
    return queryDatabase(query, [userId]);
};

const getMessagesByAsideName = async (asideName) => {
    const query = `
        SELECT Messages
        FROM MessageLog
        JOIN Aside ON Aside.AsideID = MessageLog.AsideID
        WHERE Aside.AsideName = ?;
    `;
    return queryDatabase(query, [asideName]);
};

module.exports = { getAllAsidesOfUser, getMessagesByAsideName };
