const SQSClient = require("../Components/SQSClient");
require("dotenv").config({path: "../Secrets/secrets.env"});

const { SQS_OUTBOUND_QUEUE_URL} = process.env;

const sendToOutboundSQS = async () => {
    const jsonBlob = { platform: "Slack", PSA: 'C084S8WJ360', MSG: "Testing Slack Outbound" };

    await SQSClient.sendMessage(SQS_OUTBOUND_QUEUE_URL, jsonBlob);
}

(async () => {
    try {
        await sendToOutboundSQS();
    } catch (error) {
        console.error("Error processing message:", error.message);
    }
})();
