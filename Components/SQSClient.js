const { SQSClient } = require("@aws-sdk/client-sqs");
require("dotenv").config({ path: "../secrets.env" });

const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION
} = process.env;

// Create and export an SQS client
const sqsClient = new SQSClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

module.exports = sqsClient;
