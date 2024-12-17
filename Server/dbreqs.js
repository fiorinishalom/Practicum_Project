const mysql = require("mysql2/promise");
require("dotenv").config({ path: '../Secrets/secrets.env' });

// Create a pool for better connection management
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

const getAllAsidesOfUser = async (userId) => {
    const query = `
    SELECT Aside.AsideID, Aside.asideName
        FROM Aside
        JOIN UserAside ON Aside.AsideID = UserAside.AsideID
        JOIN Accounts ON UserAside.userID = Accounts.userID
        WHERE Accounts.userId = ?;
    `;

    try {
        // Get a connection from the pool
        const connection = await dbPool.getConnection();
        const [rows] = await connection.query(query, [userId]);
        
        // Release the connection back to the pool
        connection.release();
        
        return rows;
    } catch (error) {
        console.error('Error fetching asides:', error);
        throw error; // Rethrow the error for further handling if needed
    }
};

const getMessagesFromAside = async (asideId) => {
    const query = `
    SELECT Aside.AsideID, Aside.asideName
        FROM Aside
        JOIN UserAside ON Aside.AsideID = UserAside.AsideID
        JOIN Accounts ON UserAside.userID = Accounts.userID
        WHERE Accounts.userId = ?;
    `;

    try {
        // Get a connection from the pool
        const connection = await dbPool.getConnection();
        const [rows] = await connection.query(query, [userId]);
        
        // Release the connection back to the pool
        connection.release();
        
        return rows;
    } catch (error) {
        console.error('Error fetching asides:', error);
        throw error; // Rethrow the error for further handling if needed
    }
};



module.exports = { getAllAsidesOfUser, getMessagesFromAside };
