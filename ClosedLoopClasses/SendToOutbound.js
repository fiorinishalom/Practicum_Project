const { SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = require("../Components/SQSClient.js"); // Reuse the client from Components
require("dotenv").config({ path: './secrets.env' });

const { SQS_OUTBOUND_QUEUE_URL } = process.env;

// Function to send a message to the SQS queue
const sendMessageToQueue = async (messageBody) => {
    try {
        const sendCommand = new SendMessageCommand({
            QueueUrl: SQS_OUTBOUND_QUEUE_URL, // Same queue URL
            MessageBody: messageBody, // The message content
        });

        const response = await sqsClient.send(sendCommand);
        console.log("Message sent to SQS successfully:", response.MessageId);
    } catch (error) {
        console.error("Error sending message to SQS:", error);
    }
};

module.exports = { sendMessageToQueue };
