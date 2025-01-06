const { parentPort } = require('worker_threads');
const SQSClient = require("../Components/SQSClient");
const dbConnection = require("../Components/DB_Conn");
const { verifySender, logMessage } = require("../Components/DB_Conn");

const {
    SQS_INBOUND_QUEUE_URL,
    SQS_OUTBOUND_QUEUE_URL
} = process.env;

const processQueue = async () => {
    while (true) {
        console.log("Worker checking for messages...");

        const messages = await SQSClient.receiveMessages(SQS_INBOUND_QUEUE_URL, 1, 10);

        if (messages.length > 0) {
            console.log("Messages found in the queue. Processing...");

            // Process the first message
            const message = messages[0];
            const { Body, ReceiptHandle } = message;

            try {
                const parsedBody = JSON.parse(Body);
                const { sender, body: messageBody, subject: asideInfo } = parsedBody;
                const asideIdInt = parseInt(asideInfo, 10);

                console.log(`Processing Sender: ${sender}, AsideID: ${asideIdInt}, Message: ${messageBody}`);

                const userCommand = messageBody.toLowerCase();

                if (userCommand.includes("#join")) {
                    const platform = platformFinder(userCommand);
                    await addRegUser(platform, sender, asideIdInt);
                } else if (userCommand.includes("#stop")) {
                    await removeRegUser(sender, asideIdInt);
                } else {
                    console.log("Verifying Sender");
                    const senderInfo = await verifySender(sender);
                    if (senderInfo != null) {
                        const { UserID, Username } = senderInfo;
                        console.log(`Just got UserID: ${UserID} and Username: ${Username}`);
                        console.log("About to log the message");
                        await logMessage(asideIdInt, UserID, messageBody);

                        const psaData = await getPSAsAndPlatformsOfAsideMembers(asideIdInt);
                        console.log(`Retrieved PSA data for Aside ${asideIdInt}:`, psaData);

                        for (const { PSA, platform } of psaData) {
                            const outJsonBlob = {
                                Platform: platform,
                                PSA,
                                MSG: messageBody
                            };
                            await SQSClient.sendMessage(SQS_OUTBOUND_QUEUE_URL, outJsonBlob);
                        }
                    } else {
                        console.log("Unauthorized Sender");
                    }
                }
                // After processing, delete the message from the queue
                await SQSClient.deleteMessage(SQS_INBOUND_QUEUE_URL, ReceiptHandle);
                console.log("Processed and deleted the message from SQS.");

                // Notify the main thread that the queue is still not empty
                parentPort.postMessage('not-empty');

            } catch (error) {
                console.error(`Error processing message: ${error.message}`);
            }
        } else {
            console.log("Queue is empty. Worker terminating.");
            parentPort.postMessage('empty');
            break; // Terminate the worker when the queue is empty
        }
    }
};

// Start processing the queue
(async () => {
    try {
        await processQueue();
    } catch (error) {
        console.error("Error processing message:", error.message);
    }
})();

// Function to determine the platform from the command
const platformFinder = (userCommand) => {
    if (userCommand.includes("slack")) return "Slack";
    if (userCommand.includes("email")) return "Email";
    return "Unknown";
};

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

    return Array.isArray(rows) ? rows.map(row => ({ PSA: row.PSA, platform: row.Platform })) : [];
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
