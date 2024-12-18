const dbConnection = require("../Components/DB_Conn");
const getMessageSender = require("../SendingToOutboundQueue/getMessageSender");
const sqsClient = require("../Components/SQSClient");
const {ReceiveMessageCommand} = require("@aws-sdk/client-sqs");


require("dotenv").config({ path: "../Secrets/secrets.env" });
const { SQS_INBOUND_QUEUE_URL } = process.env;

// Function to query PSAs and platforms for Aside members
const getPSAsAndPlatformsOfAsideMembers = async (asideId) => {
    const query = `
        SELECT Accounts.PSA, Accounts.Platform
        FROM Accounts
        INNER JOIN UserAside ON Accounts.UserID = UserAside.UserID
        INNER JOIN Aside ON UserAside.AsideId = Aside.AsideId
        WHERE Aside.AsideId = ?;
    `;
    const [rows] = await dbConnection.execute(query, [asideId]);
    return rows.map(row => ({ PSA: row.PSA, platform: row.platform }));
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
    // Receive a message from the first SQS
    const received = await receiveMessageFromSQS();
    if (!received) {
        console.log("No messages received.");
        return;
    }

    const { asideID, MSG } = received.body; // Extract AsideID and MSG
    console.log(`Received AsideID: ${asideID}, Message: ${MSG}`);

    // Query the PSAs and platforms for all Aside members
    const psaData = await getPSAsAndPlatformsOfAsideMembers(asideID);
    console.log(`Retrieved PSA data for Aside ${asideID}:`, psaData);

    // Send messages to each PSA based on their platform
    for (const { PSA, platform } of psaData) {
        const sender = getMessageSender(platform); // Get platform-specific sender
        const jsonBlob = { PSA, MSG }; // Construct the JSON blob

        console.log(`Sending message to PSA ${PSA} on platform ${platform}`);
        await sender.sendMessage(jsonBlob);
    }

    // Delete the message from the SQS after processing
    await sqsClient.send(
        new DeleteMessageCommand({
            QueueUrl: SQS_INBOUND_QUEUE_URL,
            ReceiptHandle: received.receiptHandle,
        })
    );
    console.log("Processed and deleted the message from SQS.");
};

// Example usage
(async () => {
    try {
        await processMessage();
    } catch (error) {
        console.error("Error processing message:", error.message);
    }
})();
