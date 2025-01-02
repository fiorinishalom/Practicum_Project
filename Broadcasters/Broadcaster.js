
const SQSClient = require("../Components/SQSClient");
const getMessageSender = require("./getMessageSender");
require("dotenv").config({ path: "../Secrets/secrets.env" });

const { SQS_OUTBOUND_QUEUE_URL } = process.env;

const broadCastMessage = async () => {
    console.log("Checking for messages in the outbound queue...");

    try {
        // Receive a message from the SQS queue
        const messages = await SQSClient.receiveMessages(SQS_OUTBOUND_QUEUE_URL, 1, 10); // Receive 1 message, wait for 10 seconds

        if (!messages || messages.length === 0) {
            console.log("No messages received.");
            return;
        }

        const message = messages[0];
        const { Body, ReceiptHandle } = message;

        try {
            // Parse the message body
            const parsedBody = JSON.parse(Body);
            const { Platform: platform, PSA, MSG: messageBody } = parsedBody;

            if (!platform || !PSA || !messageBody) {
                console.error("Invalid message format:", parsedBody);

            }

            console.log(`Received Platform: ${platform}, PSA: ${PSA}, Message: ${messageBody}`);

            const sender = getMessageSender(platform);
            if (!sender) {
                console.error(`No sender found for platform: ${platform}`);
            }

            const jsonBlob = { PSA, MSG: messageBody };
            console.log(`Sending message to PSA ${PSA} on platform ${platform}`);

            await sender.sendMessage(jsonBlob); // Send the message using the platform-specific sender

            // Delete the message from the SQS after processing
            await SQSClient.deleteMessage(SQS_OUTBOUND_QUEUE_URL, ReceiptHandle);
            console.log("Processed and deleted the message from SQS.");
        } catch (processingError) {
            console.error(`Error processing message: ${processingError.message}`);
        }
    } catch (receiveError) {
        console.error(`Error receiving messages from SQS: ${receiveError.message}`);
    }
};

(async () => {
    try {
        await broadCastMessage();
    } catch (error) {
        console.error("Unhandled error in broadcasting message:", error.message);
    }
})();
