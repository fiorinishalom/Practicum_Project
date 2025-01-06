const { parentPort } = require('worker_threads');
const SQSClient = require("../Components/SQSClient");
const getMessageSender = require("./getMessageSender");

const { SQS_OUTBOUND_QUEUE_URL } = process.env;

const broadCastMessage = async () => {
    while (true) {
        console.log("Worker checking for messages...");

        try {
            const messages = await SQSClient.receiveMessages(SQS_OUTBOUND_QUEUE_URL, 1, 10);

            if (messages.length > 0) {
                console.log("Messages found in the queue. Processing...");

                // Process the first message
                const message = messages[0];
                const { Body, ReceiptHandle } = message;

                try {
                    // Parse the message body
                    const parsedBody = JSON.parse(Body);
                    const { Platform: platform, PSA, MSG: messageBody } = parsedBody;

                    // Delete the message from the SQS after processing
                    await SQSClient.deleteMessage(SQS_OUTBOUND_QUEUE_URL, ReceiptHandle);
                    console.log("Processed and deleted the message from SQS.");

                    // notify parent thread that Q is not empty
                    parentPort.postMessage('not-empty');

                    if (!platform || !PSA || !messageBody) {
                        console.error("Invalid message format:", parsedBody);
                        continue; // Skip further processing for this message
                    }

                    console.log(`Received Platform: ${platform}, PSA: ${PSA}, Message: ${messageBody}`);

                    const sender = getMessageSender(platform);
                    if (!sender) {
                        console.error(`No sender found for platform: ${platform}`);
                        continue; // Skip further processing for this message
                    }

                    const jsonBlob = { PSA, MSG: messageBody };
                    console.log(`Sending message to PSA ${PSA} on platform ${platform}`);

                    await sender.sendMessage(jsonBlob); // Send the message using the platform-specific sender


                } catch (processingError) {
                    console.error(`Error processing message: ${processingError.message}`);
                }
            } else {
                console.log("Queue is empty. Worker terminating.");
                parentPort.postMessage('empty');
                break; // Terminate the worker when the queue is empty
            }
        } catch (receiveError) {
            console.error(`Error receiving messages from SQS: ${receiveError.message}`);
        }
    }
};

// Start processing the queue
(async () => {
    try {
        await broadCastMessage();
    } catch (error) {
        console.error("Error processing message:", error.message);
    }
})();
