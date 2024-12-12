const fs = require('fs');
require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const AWS = require('aws-sdk');
const https = require('https');
const uriredirect = 'https://localhost:3000/oauth2callback';

// Load SSL certificates
const privateKey = process.env.SSL_PRIVATE_KEY;
const certificate = fs.readFileSync('path/to/server.cert', 'utf8');
const credentials = { key: privateKey, cert: certificate };

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