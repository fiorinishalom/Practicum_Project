// Import necessary libraries
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const dbConnection = require("../Components/DB_Conn");
const getMessageSender = require("../SendingToOutboundQueue/getMessageSender");
require("dotenv").config({ path: "../Secrets/secrets.env" });

// Load environment variables
const { AWS_REGION, SQS_INBOUND_QUEUE_URL } = process.env;

// Create SQS client
const client = new SQSClient({ region: AWS_REGION });

// Function to receive messages
const receiveMessages = async (queueUrl, maxNumberOfMessages = 1, waitTimeSeconds = 10) => {
    const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxNumberOfMessages,
        WaitTimeSeconds: waitTimeSeconds,
    });

    const response = await client.send(command);
    return response.Messages || [];
};

// Function to delete a message
const deleteMessage = async (queueUrl, receiptHandle) => {
    const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
    });

    await client.send(command);
};

// Function to query PSAs and platforms for Aside members
const getPSAsAndPlatformsOfAsideMembers = async (asideId) => {
    const query = `
        SELECT Accounts.PSA, Accounts.Platform
        FROM Accounts
                 INNER JOIN UserAside ON Accounts.UserID = UserAside.UserID
                 INNER JOIN Aside ON UserAside.AsideId = Aside.AsideId
        WHERE Aside.AsideId = ?;
    `;

    console.log('About to check DB for Aside ID:', asideId);
    const rows = await dbConnection.execute(query, [asideId]); // Call execute directly
    console.log('Rows retrieved from database:', rows); // Log the rows

    // Ensure rows is an array before mapping
    if (Array.isArray(rows)) {
        return rows.map(row => ({ PSA: row.PSA, platform: row.Platform }));
    } else {
        console.error('Expected rows to be an array, but received:', rows);
        return []; // Return an empty array if rows is not an array
    }
};

// Process message
const processMessage = async () => {
    console.log("Checking for messages in the inbound queue...");

    // Receive a message from the SQS queue
    const messages = await receiveMessages(SQS_INBOUND_QUEUE_URL, 1, 10); // Receive 1 message, wait for 10 seconds

    if (messages.length === 0) {
        console.log("No messages received.");
        return;
    }

    const message = messages[0];
    const { Body, ReceiptHandle } = message;

    try {
        // Parse the message body
        const parsedBody = JSON.parse(Body); // First parse to handle escaped JSON
        const { sender, body: messageBody, subject: asideID } = parsedBody; // Extract required fields
        const asideIdInt = parseInt(asideID, 10); // Convert AsideID to an integer
        console.log(`Received Sender: ${sender}, AsideID: ${asideIdInt}, Message: ${messageBody}`);

        // Query the PSAs and platforms for all Aside members using the subject as the AsideID
        const psaData = await getPSAsAndPlatformsOfAsideMembers(asideIdInt);
        console.log(`Retrieved PSA data for Aside ${asideIdInt}:`, psaData);

        // Send messages to each PSA based on their platform
        for (const { PSA, platform } of psaData) {
            const sender = getMessageSender(platform); // Get platform-specific sender
            const jsonBlob = { PSA, MSG: messageBody }; // Construct the JSON blob

            console.log(`Sending message to PSA ${PSA} on platform ${platform}`);
            await sender.sendMessage(jsonBlob); // Send the message using the platform-specific sender
        }

        // Delete the message from the SQS after processing
        await deleteMessage(SQS_INBOUND_QUEUE_URL, ReceiptHandle);
        console.log("Processed and deleted the message from SQS.");
    } catch (error) {
        console.error(`Error processing message: ${error.message}`);
    }
};

// Example usage
(async () => {
    try {
        await processMessage();
    } catch (error) {
        console.error("Error processing message:", error.message);
    }
})();
