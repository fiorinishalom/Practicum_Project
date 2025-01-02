const dotenv = require('dotenv');

// Load environment variables from both .env files
dotenv.config({ path: '../Secrets/SlackSecrets.env' });
dotenv.config({ path: '../Secrets/secrets.env' });

const { WebClient } = require('@slack/web-api');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

// Initialize Slack client
const slackClient = new WebClient(process.env.BOT_USER_OAUTH);

// Initialize AWS SQS client
const sqs = new SQSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const channelId = process.env.INBOUND_SLACK_CHANNEL_ID;
const queueUrl = process.env.SQS_INBOUND_QUEUE_URL;
let lastTimestamp = 0; // Initialize with 0 or load from persistent storage

async function readSlackMessages() {
    try {
        let result;
        try {
            result = await slackClient.conversations.history({
                channel: channelId,
                oldest: lastTimestamp
            });
            console.log('Fetched messages from Slack:', result);
        } catch (slackError) {
            console.error('Error fetching messages from Slack:', slackError.message);
            return;
        }

        const messages = result.messages;

        for (const message of messages) {
            try {
                const params = {
                    MessageBody: JSON.stringify(message),
                    QueueUrl: queueUrl
                };

                const command = new SendMessageCommand(params);
                await sqs.send(command);
                console.log(`Message sent to SQS: ${message.text}`);
            } catch (sqsError) {
                console.error('Error sending message to SQS:', sqsError.message);
            }
        }

        if (messages.length > 0) {
            lastTimestamp = messages[0].ts; // Update the last timestamp
        }
    } catch (error) {
        console.error('General Error:', error.message);
    }
}

readSlackMessages();