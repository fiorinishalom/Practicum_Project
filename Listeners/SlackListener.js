require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const AWS = require('aws-sdk');

// Initialize Slack client
const slackClient = new WebClient(process.env.SLACK_TOKEN);

// Initialize AWS SQS client
const sqs = new AWS.SQS({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const channelId = process.env.SLACK_CHANNEL_ID;
const queueUrl = process.env.SQS_INBOUND_QUEUE_URL;

async function readSlackMessages() {
    try {
        const result = await slackClient.conversations.history({ channel: channelId });
        const messages = result.messages;

        for (const message of messages) {
            const params = {
                MessageBody: JSON.stringify(message),
                QueueUrl: queueUrl
            };

            await sqs.sendMessage(params).promise();
            console.log(`Message sent to SQS: ${message.text}`);
        }
    } catch (error) {
        console.error('Error reading Slack messages or sending to SQS:', error.message);
    }
}

readSlackMessages();