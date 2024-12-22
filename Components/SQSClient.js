const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand } = require("@aws-sdk/client-sqs");

class SQSClientWrapper {
    // Static instance of the SQS client with a hardcoded region
    static client = new SQSClient({ region: "us-east-1" });

    // Static method to receive messages from the SQS queue
    static async receiveMessages(queueUrl, maxNumberOfMessages = 1, waitTimeSeconds = 10) {
        const command = new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: maxNumberOfMessages,
            WaitTimeSeconds: waitTimeSeconds,
        });

        const response = await this.client.send(command);
        return response.Messages || [];
    }

    // Static method to delete a message from the SQS queue
    static async deleteMessage(queueUrl, receiptHandle) {
        const command = new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: receiptHandle,
        });

        await this.client.send(command);
    }

    // Static method to send a message to the SQS queue
    static async sendMessage(queueUrl, messageBody, delaySeconds = 0) {
        const command = new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(messageBody),
            DelaySeconds: delaySeconds,
        });

        const response = await this.client.send(command);
        return response.MessageId;
    }
}

// Export the class itself
module.exports = SQSClientWrapper;
