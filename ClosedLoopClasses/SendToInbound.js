const { SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = require("../Components/SQSClient.js");
require("dotenv").config({ path: '../Secrets/secrets.env' });


const { SQS_INBOUND_QUEUE_URL } = process.env;

// Function to send a message to the SQS queue
const sendToInbound = async (message) => {
    try {
        const command = new SendMessageCommand({
            QueueUrl: SQS_INBOUND_QUEUE_URL,
            MessageBody: message,
        });

        const response = await sqsClient.send(command);
        console.log("Message sent successfully:", response.MessageId);
    } catch (error) {
        console.error("Error sending message:", error);
    }
};

// Example usage
const message = "Hello from AWS SDK v3 using custom client!";
sendToInbound(message);

