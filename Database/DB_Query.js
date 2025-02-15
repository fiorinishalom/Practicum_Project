require("dotenv").config({path: "../Secrets/secrets.env"});
const connectionPath = require ('./DBConnection');
const pool = connectionPath.getConnection();

const execute = async (query, params) => {
    const [rows] = await pool.execute(query, params);
    return rows;
};

const executeAddUser = async (platform, psa, asideId) => {
    try {
        // Check if the PSA already exists in the Accounts table
        const checkPSAQuery = `
            SELECT COUNT(*) AS count
            FROM Accounts
            WHERE PSA = ?;
        `;
        const [checkResult] = await pool.execute(checkPSAQuery, [psa]);

        if (checkResult[0].count > 0) {
            throw new Error("PSA already exists. Cannot add duplicate account.");
        }

        // Insert into Accounts if PSA does not exist
        const insertAccountQuery = `
            INSERT INTO Accounts (Platform, PSA, Role)
            VALUES (?, ?, 'User');
        `;
        const [insertResult] = await pool.execute(insertAccountQuery, [platform, psa]);

        // Get the inserted UserID
        const userId = insertResult.insertId;

        // Insert into UserAside
        const insertUserAsideQuery = `
            INSERT INTO UserAside (UserID, AsideID)
            VALUES (?, ?);
        `;
        await pool.execute(insertUserAsideQuery, [userId, asideId]);

        return {userId}; // Optionally return the user ID
    } catch (error) {
        console.error("Error adding user:", error.message);
        throw error; // Propagate error to the caller
    }
};


const executeRemoveUser = async (psa, asideId) => {
    const removeUser = `
        DELETE
        ua, a
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

const logMessage = async (asideID, UserID, msg) => {
    const addMessage = `
        INSERT INTO MessageLog(AsideID, UserID, Content)
        VALUES (?, ?, ?);
    `
    await pool.execute(addMessage, [asideID, UserID, msg]);
};
const verifySender = async (senderPSA) => {
    const query = `
        SELECT PSA, UserID, Username
        FROM Accounts
                 JOIN AdminCredentials
                      ON Accounts.UserID = AdminCredentials.AdminID
        WHERE PSA = ?
          AND Role = "Admin" LIMIT 1;
    `;

    console.log("About to check DB for PSA");
    try {
        const result = await pool.execute(query, [senderPSA]);
        console.log("Rows retrieved from database:", result);
        return result[0][0];
    } catch (error) {
        console.error("Error verifying senderPSA:", error.message);
        throw error;
    }
};

module.exports = {execute, executeAddUser, executeRemoveUser, logMessage, verifySender};