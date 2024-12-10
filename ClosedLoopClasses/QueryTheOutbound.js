const { ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = require("../Components/SQSClient.js");
require("dotenv").config({ path: './secrets.env' });

const { SQS_OUTBOUND_QUEUE_URL } = process.env; // Ensure this variable is defined in your secrets.env

// Function to query messages from the outbound SQS queue
const queryOutboundQueue = async () => {
    try {
        const receiveCommand = new ReceiveMessageCommand({
            QueueUrl: SQS_OUTBOUND_QUEUE_URL, // URL for the outbound SQS queue
            MaxNumberOfMessages: 1, // Retrieve one message at a time
            WaitTimeSeconds: 10,    // Long polling (adjust as needed)
        });

        const response = await sqsClient.send(receiveCommand);

        if (response.Messages && response.Messages.length > 0) {
            const message = response.Messages[0];
            console.log("Outbound message received:", message.Body);

            // Process the message as needed here

            // Delete the message after processing
            await deleteMessage(message.ReceiptHandle);
        } else {
            console.log("No messages available in the outbound queue.");
        }
    } catch (error) {
        console.error("Error querying the outbound queue:", error);
    }
};

// Function to delete a processed message from the outbound queue
const deleteMessage = async (receiptHandle) => {
    try {
        const deleteCommand = new DeleteMessageCommand({
            QueueUrl: SQS_OUTBOUND_QUEUE_URL, // URL for the outbound SQS queue
            ReceiptHandle: receiptHandle,
        });

        await sqsClient.send(deleteCommand);
        console.log("Outbound message deleted successfully.");
    } catch (error) {
        console.error("Error deleting outbound message:", error);
    }
};

// Query the outbound queue
queryOutboundQueue();
