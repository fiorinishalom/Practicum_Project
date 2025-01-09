const {WebClient} = require('@slack/web-api');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({path: '../Secrets/SlackSecrets.env'}); // Update the path to your .env file

// Your Bot Token
const token = process.env.BOT_USER_OAUTH;

// Check if token is defined
if (!token) {
    throw new Error('BOT_USER_OAUTH is not defined in environment variables');
}

// Initialize Slack WebClient
const slackClient = new WebClient(token);

const postMessage = async (channelId, text) => {
    try {
        // Send a message to the channel
        const response = await slackClient.chat.postMessage({
            channel: channelId,
            text: text, // Customize your message
        });

        console.log('Message sent successfully. Timestamp:', response.ts);
    } catch (error) {
        console.error('Error posting message:', error.message);
    }
};

class SendToOutboundSlack {
    async sendMessage(jsonBlob) {
        console.log("Sending message to Slack:", jsonBlob);
        const channelId = jsonBlob.PSA; // Assuming PSA is the channel ID
        const messageText = jsonBlob.MSG; // Assuming MSG is the message text

        // Ensure channelId is defined
        if (!channelId) {
            throw new Error('PSA is not defined in the provided JSON blob');
        }

        // Call postMessage with the channel ID and message text
        await postMessage(channelId, messageText);
    }
}

module.exports = SendToOutboundSlack;
