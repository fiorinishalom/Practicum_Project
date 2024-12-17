const SQSMessageSender = require("./SQSMessageSender");

class SendToOutboundEmail extends SQSMessageSender {
    constructor() {
        const SQS_OUTBOUND_QUEUE_URL = process.env.SQS_OUTBOUND_QUEUE_URL; // Email queue URL
        super(SQS_OUTBOUND_QUEUE_URL);
    }

    async sendMessage(jsonBlob) {
        console.log("Sending message to Email:", jsonBlob);
        const emailMessage = {
            PSA: jsonBlob.PSA,
            MSG: jsonBlob.MSG,
        };
        await this._sendToSQS(emailMessage);
    }
}

module.exports = SendToOutboundEmail;
