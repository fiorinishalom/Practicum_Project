// Components/SQSClient.js
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
require("dotenv").config({ path: '../secrets.env' });

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

const client = new SQSClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

const sendMessage = async (queueUrl, message) => {
    const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: message,
    });
    return client.send(command);
};

module.exports = { sendMessage };