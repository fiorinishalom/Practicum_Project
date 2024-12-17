const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { fromEnv } = require('@aws-sdk/credential-provider-env');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the .env file
const Secrets_path = path.resolve(__dirname, '../Secrets/secrets.env');
dotenv.config({ path: Secrets_path });

// Configure AWS SDK
const client = new SQSClient({
    region: process.env.AWS_REGION,
    credentials: fromEnv()
});

// Example function to send a message to SQS
async function sendMessage(queueUrl, messageBody) {
    const params = {
        QueueUrl: queueUrl,
        MessageBody: messageBody
    };

    const command = new SendMessageCommand(params);
    return client.send(command);
}

module.exports = { sendMessage };