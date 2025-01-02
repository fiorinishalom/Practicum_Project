const SQSClient = require("../Components/SQSClient");
const dbConnection = require("../Components/DB_Conn");
const {logMessage} = require("../Components/DB_Conn");
require("dotenv").config({path: "../Secrets/secrets.env"});

const {SQS_INBOUND_QUEUE_URL, SQS_OUTBOUND_QUEUE_URL} = process.env;

const verifySender = async (sender) => {
    const query = `
        SELECT PSA, UserID, Username
        FROM Accounts
                 JOIN AdminCredentials
                      ON Accounts.UserID = AdminCredentials.AdminID
        WHERE PSA = ? AND Role = "Admin";
    `;
    console.log("About to check DB for PSA");

    try {
        const result = await dbConnection.execute(query, [sender]);
        console.log("Rows retrieved from database:", result);

        // Return the first matching row if it exists, otherwise return null
        return result[0];
    } catch (error) {
        console.error("Error verifying sender:", error.message);
        throw error;
    }
};


// Function to query PSAs and platforms for Aside members
const getPSAsAndPlatformsOfAsideMembers = async (asideId) => {
    const query = `
        SELECT Accounts.PSA, Accounts.Platform
        FROM Accounts
                 JOIN UserAside ON Accounts.UserID = UserAside.UserID
                 JOIN Aside ON UserAside.AsideId = Aside.AsideId
        WHERE Aside.AsideId = ?;
    `;
    console.log("About to check DB for Aside ID:", asideId);

    const rows = await dbConnection.execute(query, [asideId]);
    console.log("Rows retrieved from database:", rows);

    return Array.isArray(rows) ? rows.map(row => ({PSA: row.PSA, platform: row.Platform})) : [];
};

// Function to add a user to an aside
const addRegUser = async (platform, psa, asideId) => {
    try {
        const rows = await dbConnection.executeAddUser(platform, psa, asideId);
        console.log("User registration successful");
        return rows;
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
};

// Function to remove a user from an aside
const removeRegUser = async (sender, asideId) => {
    try {
        const affectedRows = await dbConnection.executeRemoveUser(sender, asideId);
        if (affectedRows > 0) {
            console.log(`User removed successfully from Aside ID ${asideId}.`);
        } else {
            console.log(`No user found for Sender ${sender} and Aside ID ${asideId}.`);
        }
    } catch (error) {
        console.error("Error removing registered user:", error);
    }
};

// Function to determine the platform from the command
const platformFinder = (userCommand) => {
    if (userCommand.includes("slack")) return "Slack";
    if (userCommand.includes("email")) return "Email";
    return "Unknown";
};

// Process message
const processMessage = async () => {
    console.log("Checking for messages in the inbound queue...");

    const messages = await SQSClient.receiveMessages(SQS_INBOUND_QUEUE_URL, 1, 10);

    if (messages.length === 0) {
        console.log("No messages received.");
        return;
    }

    const message = messages[0];
    const {Body, ReceiptHandle} = message;

    try {
        const parsedBody = JSON.parse(Body);
        const {sender, body: messageBody, subject: asideInfo} = parsedBody;
        const asideIdInt = parseInt(asideInfo, 10);




        console.log(`Received Sender: ${sender}, AsideID: ${asideIdInt}, Message: ${messageBody}`);

        const userCommand = messageBody.toLowerCase();

        if (userCommand.includes("#join")) {
            const platform = platformFinder(userCommand);
            await addRegUser(platform, sender, asideIdInt);
        } else if (userCommand.includes("#stop")) {
            await removeRegUser(sender, asideIdInt);
        } else {
            const senderInfo = await verifySender(sender);
            if (senderInfo != null) {
                const {UserID, Username} = senderInfo;
                await logMessage(asideIdInt, UserID, Username);

                const psaData = await getPSAsAndPlatformsOfAsideMembers(asideIdInt);
                console.log(`Retrieved PSA data for Aside ${asideIdInt}:`, psaData);

                for (const {PSA, platform} of psaData) {
                    const outJsonBlob = {
                        Platform: platform,
                        PSA,
                        MSG: messageBody
                    };
                    await SQSClient.sendMessage(SQS_OUTBOUND_QUEUE_URL, outJsonBlob);

                }
            } else console.log("Unauthorized Sender");
            await SQSClient.deleteMessage(SQS_INBOUND_QUEUE_URL, ReceiptHandle);
            console.log("Processed and deleted the message from SQS.");


        }


    } catch (error) {
        console.error(`Error processing message: ${error.message}`);
    }
};

(async () => {
    try {
        await processMessage();
    } catch (error) {
        console.error("Error processing message:", error.message);
    }
})();
