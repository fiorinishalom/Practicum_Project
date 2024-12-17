const dbConnection = require("../Components/DB_Conn");
const getMessageSender = require("../SendingToOutboundQueue/getMessageSender");
const { ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = require("../Components/SQSClient");

require("dotenv").config({ path: "../Secrets/secrets.env" });
const { SQS_INBOUND_QUEUE_URL } = process.env;

// Function to query PSAs
const getPSAsOfAsideMembers = async (asideId) => {
    const query = `
        SELECT Accounts.PSA 
        FROM Accounts
        INNER JOIN asideUsers ON Accounts.userID = asideUsers.userId
        INNER JOIN Asides ON asideUsers.asideId = Asides.asideId
        WHERE Asides.asideId = ?;
    `;
    const [rows] = await dbConnection.execute(query, [asideId]);
    return rows.map(row => row.PSA);
};

// Receive message from first SQS
const receiveMessageFromSQS = async () => {
    const command = new ReceiveMessageCommand({
        QueueUrl: SQS_INBOUND_QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 10,
    });

    const response = await sqsClient.send(command);
    if (response.Messages && response.Messages.length > 0) {
        const message = response.Messages[0];
        return { body: JSON.parse(message.Body), receiptHandle: message.ReceiptHandle };
    }
    return null;
};

// Process message
const processMessage = async () => {
    const received = await receiveMessageFromSQS();
    if (!received) return;

    const { asideID, MSG, platform } = received.body;

    const psas = await getPSAsOfAsideMembers(asideID);
    console.log(`PSAs for Aside ${asideID}:`, psas);

    const sender = getMessageSender(platform); // Get platform-specific sender
    for (const psa of psas) {
        const jsonBlob = { PSA: psa, MSG };
        await sender.sendMessage(jsonBlob);
    }

    // Delete message after processing
    await sqsClient.send(
        new DeleteMessageCommand({
            QueueUrl: SQS_INBOUND_QUEUE_URL,
            ReceiptHandle: received.receiptHandle,
        })
    );
};


(async () => {
    await processMessage();
})();






















// const { ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
// const sqsClient = require("../Components/SQSClient.js");
// const { sendMessageToQueue } = require("../ClosedLoopClasses/SendToOutbound.js"); // Adjusted the path
// const dbConnection = require("../Test_DB_Conn"); // Import the database connection
// require("dotenv").config({ path: '../Secrets/secrets.env' });
//
//
// const { SQS_INBOUND_QUEUE_URL } = process.env; // Changed to SQS_INBOUND_QUEUE_URL
//
// // Function to query messages from the SQS queue
// const queryQueue = async () => {
//     try {
//         const receiveCommand = new ReceiveMessageCommand({
//             QueueUrl: SQS_INBOUND_QUEUE_URL, // Updated to SQS_INBOUND_QUEUE_URL
//             MaxNumberOfMessages: 1, // Retrieve one message at a time
//             WaitTimeSeconds: 10,    // Long polling (adjust as needed)
//         });
//
//         const response = await sqsClient.send(receiveCommand);
//
//         if (response.Messages && response.Messages.length > 0) {
//             const message = response.Messages[0];
//             console.log("Message received:", message.Body);
//
//             // Send the message to the same SQS queue via SendToOutbound.js
//             await sendMessageToQueue(message.Body);
//
//             // Delete the message after processing
//             await deleteMessage(message.ReceiptHandle);
//         } else {
//             console.log("No messages available in the queue.");
//         }
//     } catch (error) {
//         console.error("Error querying the queue:", error);
//     }
// };
//
//
// // Function to get all PSAs of members in an Aside
// const getPSAsOfAsideMembers = async (asideId) => {
//     try {
//         const query = `
//             SELECT Accounts.PSA
//             FROM Accounts
//             INNER JOIN asideUsers ON Accounts.userID = asideUsers.userId
//             INNER JOIN Asides ON asideUsers.asideId = Asides.asideId
//             WHERE Asides.asideId = ?;
//         `;
//         // Use dbConnection here to execute the query
//         const [rows] = await dbConnection.execute(query, [asideId]); // Make sure dbConnection is used
//
//         if (rows.length > 0) {
//             console.log(`PSAs of members in Aside ${asideId}:`, rows);
//             // Map the rows to extract PSA values into an array
//             return rows.map(row => row.PSA);
//         } else {
//             console.log(`No members found for Aside ${asideId}.`);
//             return [];
//         }
//     } catch (error) {
//         console.error("Error querying database:", error.message);
//         throw error; // Re-throw error for further handling
//     }
// };
//
//
// // Function to delete a processed message from the queue
// const deleteMessage = async (receiptHandle) => {
//     try {
//         const deleteCommand = new DeleteMessageCommand({
//             QueueUrl: SQS_INBOUND_QUEUE_URL, // Updated to SQS_INBOUND_QUEUE_URL
//             ReceiptHandle: receiptHandle,
//         });
//
//         await sqsClient.send(deleteCommand);
//         console.log("Message deleted successfully.");
//     } catch (error) {
//         console.error("Error deleting message:", error);
//     }
// };
//
// // Query the queue
// queryQueue();
//
//
// (async () => {
//     const asideId = 123456;
//     const psas = await getPSAsOfAsideMembers(asideId);
//     console.log("PSAs:", psas); // Log the PSAs array
// })();
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
// // const SQSClient = require('../Components/SQSClient.js');
// // require("dotenv").config({ path: "../Secrets/secrets.env" });
// //
// // const { SQS_QUEUE_URL } = process.env;
// // const sqsClient = new SQSClient(SQS_QUEUE_URL);
// //
// // (async () => {
// //     try {
// //         console.log("Receiving message...");
// //         const messages = await sqsClient.receiveMessage();
// //
// //         if (messages.length === 0) {
// //             console.log("No messages available.");
// //             return;
// //         }
// //
// //         for (const message of messages) {
// //             console.log("Message received:", message.Body);
// //
// //             // Delete the message after processing
// //             await sqsClient.deleteMessage(message.ReceiptHandle);
// //             console.log("Message deleted successfully.");
// //         }
// //     } catch (err) {
// //         console.error("Error during SQS operations:", err);
// //     }
// // })();
