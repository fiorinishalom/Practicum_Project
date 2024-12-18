// getMessageSender.js
const SlackSender = require("./SendToOutboundSlack");
const EmailSender = require("./SendToOutboundEmail");

// Function to return the appropriate message sender
const getMessageSender = (platform) => {
    switch (platform) {
        case "Slack":
            return new SlackSender(); // Slack sender logic
        case "Email":
            return new EmailSender(); // Email sender logic
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
};

module.exports = getMessageSender;
