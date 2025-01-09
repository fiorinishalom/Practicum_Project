const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const {WebClient} = require('@slack/web-api');
const {SQSClient, SendMessageCommand} = require('@aws-sdk/client-sqs');

// Define the base directory for the script (can be adjusted to fit your folder structure)
const baseDir = __dirname;

// Load environment variables from both .env files with absolute paths
dotenv.config({ path: path.resolve(baseDir, '../Secrets/SlackSecrets.env') });
dotenv.config({ path: path.resolve(baseDir, '../Secrets/secrets.env') });

// Path to the timestamp file with an absolute path
const timestampFilePath = path.resolve(baseDir, '../Components/SlackTimeStamp.json');

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

// Function to read the last timestamp from the file
const readLastTimestamp = () => {
    if (fs.existsSync(timestampFilePath)) {
        const data = fs.readFileSync(timestampFilePath, 'utf8');
        return JSON.parse(data).lastTimestamp;
    }
    return '0'; // Default value if the file does not exist
};

// Function to write the last timestamp to the file
const writeLastTimestamp = (timestamp) => {
    const data = JSON.stringify({lastTimestamp: timestamp});
    fs.writeFileSync(timestampFilePath, data, 'utf8');
    console.log('Last timestamp written to file:', timestamp);
};

// Function to handle the message parsing and SQS sending
const processMessage = async (message) => {
    const messageText = message.text || '';
    //Pattern requires messages to use a hashtag followed by a 6-digit number
    const hashtagPattern = /^#(\d{6})(.*)$/;
    const match = messageText.match(hashtagPattern);

    if (match) {
        const AsideID = match[1];
        const body = match[2].trim();
        const jsonBlob = {
            sender: message.user,
            body: body,
            subject: AsideID
        };

        const params = {
            MessageBody: JSON.stringify(jsonBlob),
            QueueUrl: queueUrl
        };

        try {
            const command = new SendMessageCommand(params);
            await sqs.send(command);
            console.log(`Message sent to SQS: ${JSON.stringify(jsonBlob)}`);
        } catch (error) {
            console.error('Error sending message to SQS:', error.message);
        }
    } else {
        console.log(`Message skipped (does not meet criteria): ${messageText}`);
    }
};

// Function to fetch Slack messages and process them
const readSlackMessages = async () => {
    let result;
    try {
        result = await slackClient.conversations.history({
            channel: channelId,
            oldest: readLastTimestamp(),
        });
        // console.log('Fetched messages from Slack:', result);
    } catch (slackError) {
        console.error('Error fetching messages from Slack:', slackError.message);
        return;
    }

    const messages = result.messages;
    for (const message of messages) {
        await processMessage(message);
    }

    if (messages.length > 0) {
        const newTimestamp = messages[0].ts;
        writeLastTimestamp(newTimestamp);
    } else console.log('No new Slack Messages');
};

// Start the process and re-query every 2 seconds
function begin(){setInterval(readSlackMessages, 2000);}

module.exports = {begin};
