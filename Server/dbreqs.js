const mysql = require("mysql2/promise");
require("dotenv").config({path: '../Secrets/secrets.env'});

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

const getMessagesByAsideName = async (asideId) => {
    const query = `
        SELECT Content
        FROM MessageLog
        WHERE AsideID = ?;
    `;
    return queryDatabase(query, [asideId]);
};

const checkLogin = async (username, password) => {
    const query = `
        SELECT *
        FROM AdminCredentials
        WHERE Username = ?
          AND Password = ? LIMIT 1;


    `;
    return queryDatabase(query, [username, password]);
};

const insertMessage = async (userId, asideId, msg) => {
    const query = `
        INSERT INTO MessageLog (UserID, AsideID, Content, Timestamp)
        VALUES (?, ?, ?, NOW());
    `;
    return queryDatabase(query, [userId, asideId, msg]);
};


module.exports = {getAllAsidesOfUser, getMessagesByAsideName, checkLogin, insertMessage};
