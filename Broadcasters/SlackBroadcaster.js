const { WebClient } = require('@slack/web-api');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: '../Secrets/SlackSecrets.env' }); // Update the path to your .env file

// Your Bot Token
const token = process.env.BOT_USER_OAUTH;

if (!token) {
    throw new Error('BOT_USER_OAUTH is not defined in environment variables');
}

// Initialize Slack WebClient
const slackClient = new WebClient(token);

// Function to post a new message to a channel
const postMessage = async () => {
    try {
        const channelId = process.env.SLACK_CHANNEL_ID; // Ensure this is set in your .env file
        if (!channelId) {
            throw new Error('SLACK_CHANNEL_ID is not defined in environment variables');
        }

        // Send a message to the channel
        const response = await slackClient.chat.postMessage({
            channel: channelId,
            text: 'Hello, this is a message to #message-inbox!', // Customize your message
        });

        console.log('Message sent successfully. Timestamp:', response.ts);
    } catch (error) {
        console.error('Error posting message:', error.message);
    }
};

// Execute the function
postMessage();
