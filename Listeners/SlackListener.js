const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Path to the timestamp file
const timestampFilePath = path.join(__dirname, '../Components/SlackTimeStamp.json');

// Load environment variables from both .env files
dotenv.config({ path: '../Secrets/SlackSecrets.env' });
dotenv.config({ path: '../Secrets/secrets.env' });

const { WebClient } = require('@slack/web-api');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

// Function to read the last timestamp from the file
function readLastTimestamp() {
    if (fs.existsSync(timestampFilePath)) {
        const data = fs.readFileSync(timestampFilePath, 'utf8');
        return JSON.parse(data).lastTimestamp;
    }
    return '0'; // Default value if the file does not exist
}

// Function to write the last timestamp to the file
function writeLastTimestamp(timestamp) {
    const data = JSON.stringify({ lastTimestamp: timestamp });
    fs.writeFileSync(timestampFilePath, data, 'utf8');
    console.log('Last timestamp written to file:', timestamp);
}

// Initialize lastTimestamp from the file
let lastTimestamp = readLastTimestamp(); // Initialize with 0 or load from persistent storage

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
            const messageText = message.text || ''; // Handle cases where message.text is undefined

            // Check if the message starts with a hashtag and has six numeric characters
            const hashtagPattern = /^#(\d{6})(.*)$/; // Matches # followed by 6 digits and the rest of the text
            const match = messageText.match(hashtagPattern);

            if (match) {
                const AsideID = match[1]; // First six digits
                const body = match[2].trim(); // Remaining message, trimmed of leading/trailing whitespace

                // Create a JSON blob with the parsed details
                const jsonBlob = {
                    sender: message.user,
                    AsideID: AsideID,
                    body: body,
                };

                const params = {
                    MessageBody: JSON.stringify(jsonBlob),
                    QueueUrl: queueUrl
                };

                const command = new SendMessageCommand(params);
                await sqs.send(command);
                console.log(`Message sent to SQS: ${JSON.stringify(jsonBlob)}`);
            } else {
                console.log(`Message skipped (does not meet criteria): ${messageText}`);
            }
        }

        if (messages.length > 0) {
            lastTimestamp = messages[0].ts; // Update the last timestamp
            writeLastTimestamp(lastTimestamp); // Persist the last timestamp
        }
    } catch (error) {
        console.error('General Error:', error.message);
    }
}

readSlackMessages();