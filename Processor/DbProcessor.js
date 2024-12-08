const SQSClient = require('../Components/SQSClient.js');
require("dotenv").config({ path: "../secrets.env" });

const { SQS_QUEUE_URL } = process.env;
const sqsClient = new SQSClient(SQS_QUEUE_URL);

(async () => {
    try {
        console.log("Receiving message...");
        const messages = await sqsClient.receiveMessage();

        if (messages.length === 0) {
            console.log("No messages available.");
            return;
        }

        for (const message of messages) {
            console.log("Message received:", message.Body);

            // Delete the message after processing
            await sqsClient.deleteMessage(message.ReceiptHandle);
            console.log("Message deleted successfully.");
        }
    } catch (err) {
        console.error("Error during SQS operations:", err);
    }
})();
