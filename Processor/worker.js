const { parentPort } = require('worker_threads');
const SQSClient = require("../Components/SQSClient");

const processQueue = async () => {
    while (true) {
        console.log("Worker checking for messages...");

        const messages = await SQSClient.receiveMessages(SQS_INBOUND_QUEUE_URL, 1, 10);

        if (messages.length > 0) {
            console.log("Messages found in the queue. Processing...");

            // Process the first message
            const message = messages[0];
            const { Body, ReceiptHandle } = message;

            try {
                const parsedBody = JSON.parse(Body);
                const { sender, body: messageBody, subject: asideInfo } = parsedBody;
                const asideIdInt = parseInt(asideInfo, 10);

                console.log(`Processing Sender: ${sender}, AsideID: ${asideIdInt}, Message: ${messageBody}`);

                // Process the message (e.g., verify sender, register users, etc.)
                // This is where your message processing logic goes

                // After processing, delete the message from the queue
                await SQSClient.deleteMessage(SQS_INBOUND_QUEUE_URL, ReceiptHandle);
                console.log("Processed and deleted the message from SQS.");

                // Notify the main thread that the queue is still not empty
                parentPort.postMessage('not-empty');
            } catch (error) {
                console.error(`Error processing message: ${error.message}`);
            }
        } else {
            console.log("Queue is empty. Worker terminating.");
            parentPort.postMessage('empty');
            break; // Terminate the worker when the queue is empty
        }
    }
};

// Start processing the queue
processQueue();
