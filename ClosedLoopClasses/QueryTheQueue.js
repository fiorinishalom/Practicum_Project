// Import required modules
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
require("dotenv").config({ path: './secrets.env' });

// Load environment variables from the .env file
const {
    SQS_ACCESS_KEY_ID,
    SQS_SECRET_ACCESS_KEY,
    SQS_REGION,
    SQS_QUEUE_URL,
} = process.env;

// Create an SQS client with credentials and region
const sqsClient = new SQSClient({
    region: SQS_REGION,  // Ensure this variable is set correctly in .env
    credentials: {
        accessKeyId: SQS_ACCESS_KEY_ID,
        secretAccessKey: SQS_SECRET_ACCESS_KEY,
    },
});

// Function to receive a message from SQS
const receiveFromSQS = async () => {
    try {
        // Receive a message from the queue
        const receiveCommand = new ReceiveMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            MaxNumberOfMessages: 1,  // Fetch a maximum of 1 message (change as needed)
            WaitTimeSeconds: 0,      // Short polling, set to > 0 for long polling
        });

        const response = await sqsClient.send(receiveCommand);

        if (response.Messages && response.Messages.length > 0) {
            const message = response.Messages[0];
            console.log("Received message:", message.Body);

            // Delete the message from the queue (pop it off the queue)
            const deleteCommand = new DeleteMessageCommand({
                QueueUrl: SQS_QUEUE_URL,
                ReceiptHandle: message.ReceiptHandle,
            });

            await sqsClient.send(deleteCommand);
            console.log("Message deleted from queue");
        } else {
            console.log("No messages to receive");
        }
    } catch (error) {
        console.error("Error receiving message:", error);
    }
};

// Call the function to receive and delete a message
receiveFromSQS();
