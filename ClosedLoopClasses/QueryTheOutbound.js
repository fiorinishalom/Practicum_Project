// QueryTheOutbound.js
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = require("../Components/SQSClient.js");
const { sendEmail } = require("../Components/emailService"); // Import the sendEmail function
require("dotenv").config({ path: '../Secrets/secrets.env' });

const { SQS_OUTBOUND_QUEUE_URL } = process.env;

// Function to query messages from the SQS outbound queue
const queryOutboundQueue = async () => {
    try {
        const receiveCommand = new ReceiveMessageCommand({
            QueueUrl: SQS_OUTBOUND_QUEUE_URL,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 10,
        });

        const response = await sqsClient.send(receiveCommand);

        if (response.Messages && response.Messages.length > 0) {
            const message = response.Messages[0];
            console.log("Message received:", message.Body);

            // Here, you can send the email with the message body
            await sendEmail('recipient@example.com', 'Subject Here', message.Body); // Change recipient@example.com to the actual recipient's email

            // Delete the message after processing
            await deleteMessage(message.ReceiptHandle);
        } else {
            console.log("No messages available in the outbound queue.");
        }
    } catch (error) {
        console.error("Error querying the outbound queue:", error);
    }
};

// Function to delete a processed message from the queue
const deleteMessage = async (receiptHandle) => {
    try {
        const deleteCommand = new DeleteMessageCommand({
            QueueUrl: SQS_OUTBOUND_QUEUE_URL,
            ReceiptHandle: receiptHandle,
        });

        await sqsClient.send(deleteCommand);
        console.log("Message deleted successfully.");
    } catch (error) {
        console.error("Error deleting message:", error);
    }
};

// Query the outbound queue
queryOutboundQueue();
