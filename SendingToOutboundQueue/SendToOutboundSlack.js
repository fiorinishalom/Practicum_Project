const SQSMessageSender = require("./SQSMessageSender");

class SendToOutboundSlack extends SQSMessageSender {
    constructor() {
        const SLACK_SQS_URL = process.env.SLACK_SQS_URL; // Slack queue URL
        //TODO  Create an Outbound SQS for Slack
        super(SLACK_SQS_URL);
    }

    async sendMessage(jsonBlob) {
        console.log("Sending message to Slack:", jsonBlob);
        const slackMessage = {
            PSA: jsonBlob.PSA,
            MSG: jsonBlob.MSG,
        };
        await this._sendToSQS(slackMessage);
    }
}

module.exports = SendToOutboundSlack;
