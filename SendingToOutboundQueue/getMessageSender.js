// getMessageSender.js
const SlackSender = require("./SendToOutboundSlack");
const EmailSender = require("./SendToOutboundEmail");

// Function to return the appropriate message sender
const getMessageSender = (platform) => {
    switch (platform) {
        case "slack":
            return new SlackSender(); // Slack sender logic
        case "email":
            return new EmailSender(); // Email sender logic
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
};

module.exports = getMessageSender;
