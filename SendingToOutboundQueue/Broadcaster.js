const SQSClient = require("../Components/SQSClient");
const getMessageSender = require("./getMessageSender");
const { SQS_OUTBOUND_QUEUE_URL} = process.env;

const broadCastMessage = async () => {
    console.log("Checking for messages in the inbound queue...");

    // Receive a message from the SQS queue
    const messages = await SQSClient.receiveMessages(SQS_OUTBOUND_QUEUE_URL, 1, 10); // Receive 1 message, wait for 10 seconds

    if (messages.length === 0) {
        console.log("No messages received.");
        return;
    }

    const message = messages[0];
    const {Body, ReceiptHandle} = message;

    try {
        // Parse the message body
        const parsedBody = JSON.parse(Body); // First parse to handle escaped JSON
        const {
            Platform: platform,
            PSA: PSA,
            MSG: messageBody
        } = parsedBody;


        console.log(`Received Desired Platform: ${platform}, PSA: ${PSA}, Message: ${messageBody}`);


        const sender = getMessageSender(platform); // Get platform-specific sender
        const jsonBlob = {PSA, MSG: messageBody};
        console.log(`Sending message to PSA ${PSA} on platform ${platform}`);

        await sender.sendMessage(jsonBlob); // Send the message using the platform-specific sender

    // Delete the message from the SQS after processing
    await SQSClient.deleteMessage(SQS_OUTBOUND_QUEUE_URL, ReceiptHandle);
    console.log("Processed and deleted the message from SQS.");
} catch (error) {
    console.error(`Error processing message: ${error.message}`);
}
};

(async () => {
    try {
        await broadCastMessage();
    } catch (error) {
        console.error("Error processing message:", error.message);
    }
})();