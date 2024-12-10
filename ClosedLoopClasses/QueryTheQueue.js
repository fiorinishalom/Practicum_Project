const { ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = require("../Components/SQSClient.js");
require("dotenv").config({ path: './secrets.env' });


const { SQS_QUEUE_URL } = process.env;

// Function to query messages from the SQS queue
const queryQueue = async () => {
    try {
        const receiveCommand = new ReceiveMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            MaxNumberOfMessages: 1, // Retrieve one message at a time
            WaitTimeSeconds: 10,    // Long polling (adjust as needed)
        });

        const response = await sqsClient.send(receiveCommand);

        if (response.Messages && response.Messages.length > 0) {
            const message = response.Messages[0];
            console.log("Message received:", message.Body);

            // Delete the message after processing
            await deleteMessage(message.ReceiptHandle);
        } else {
            console.log("No messages available in the queue.");
        }
    } catch (error) {
        console.error("Error querying the queue:", error);
    }
};

// Function to delete a processed message from the queue
const deleteMessage = async (receiptHandle) => {
    try {
        const deleteCommand = new DeleteMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            ReceiptHandle: receiptHandle,
        });

        await sqsClient.send(deleteCommand);
        console.log("Message deleted successfully.");
    } catch (error) {
        console.error("Error deleting message:", error);
    }
};

// Query the queue
queryQueue();
