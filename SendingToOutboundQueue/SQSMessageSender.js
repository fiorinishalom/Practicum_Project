const { SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = require("../Components/SQSClient"); // Import SQS client

// Base class for sending messages to SQS
class SQSMessageSender {
    constructor(queueUrl) {
        if (new.target === SQSMessageSender) {
            throw new Error("Cannot instantiate abstract class SQSMessageSender");
        }
        this.queueUrl = queueUrl;
    }

    // Abstract method to send message - must be implemented in child classes
    async sendMessage(jsonBlob) {
        this._jsonBlob = jsonBlob;
        throw new Error("sendMessage() must be implemented in a derived class.");
    }

    // Shared logic to send to SQS
    async _sendToSQS(messageBody) {
        try {
            const sendCommand = new SendMessageCommand({
                QueueUrl: this.queueUrl,
                MessageBody: JSON.stringify(messageBody),
            });
            await sqsClient.send(sendCommand);
            console.log("Message sent successfully:", messageBody);
        } catch (error) {
            console.error("Error sending message to SQS:", error.message);
            throw error;
        }
    }
}

module.exports = SQSMessageSender;
