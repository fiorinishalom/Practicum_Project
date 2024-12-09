const AWS = require('aws-sdk');
require("dotenv").config({ path: "../secrets.env" });

AWS.config.update({ region: 'us-east-1' });

class SQSClient {
    constructor(queueUrl) {
        this.sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
        this.queueUrl = queueUrl;
    }

    async sendMessage(messageBody) {
        const params = {
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify(messageBody),
        };
        return this.sqs.sendMessage(params).promise();
    }

    async receiveMessage(maxMessages = 1, waitTime = 10) {
        const params = {
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: maxMessages,
            WaitTimeSeconds: waitTime,
        };

        const data = await this.sqs.receiveMessage(params).promise();
        if (data.Messages && data.Messages.length > 0) {
            return data.Messages;
        }
        return [];
    }

    async deleteMessage(receiptHandle) {
        const params = {
            QueueUrl: this.queueUrl,
            ReceiptHandle: receiptHandle,
        };
        return this.sqs.deleteMessage(params).promise();
    }
}

module.exports = SQSClient;
