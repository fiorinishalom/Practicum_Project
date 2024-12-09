// Import required modules
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
require("dotenv").config({ path: './secrets.env' });
console.log("Environment variables loaded:", process.env.SQS_ACCESS_KEY_ID);

// Load environment variables from the .env file
const {
    SQS_ACCESS_KEY_ID,
    SQS_SECRET_ACCESS_KEY,
    SQS_REGION,
    SQS_QUEUE_URL,
} = process.env;

// Create an SQS client with credentials and region
const sqsClient = new SQSClient({
    region: SQS_REGION,
    credentials: {
        accessKeyId: SQS_ACCESS_KEY_ID,
        secretAccessKey: SQS_SECRET_ACCESS_KEY,
    },
});

// Function to send message to SQS
const sendToSQS = async (message) => {
    try {
        const command = new SendMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            MessageBody: message,
        });

        const response = await sqsClient.send(command);
        console.log("Message sent successfully:", response.MessageId);
    } catch (error) {
        console.error("Error sending message:", error);
    }
};

// Send a test message
const message = "This is a test message to SQS";
sendToSQS(message);
