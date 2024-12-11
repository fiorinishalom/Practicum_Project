const base64url = require('base64url'); // npm install base64url
require('dotenv').config({ path: '../secrets.env' });
const { google } = require('googleapis');
const { simpleParser } = require('mailparser');
const { sendMessage } = require('../Components/SQSClient');

// Load environment variables from the .env file
const {
    SQS_INBOUND_QUEUE_URL,
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REFRESH_TOKEN
} = process.env;

// Ensure all required environment variables are loaded
if (!SQS_INBOUND_QUEUE_URL || !OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET || !OAUTH_REFRESH_TOKEN) {
    throw new Error('Missing required environment variables');
}

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, 'http://localhost:3000/oauth2callback');
oauth2Client.setCredentials({ refresh_token: OAUTH_REFRESH_TOKEN });

async function processEmail(email) {
    try {
        const decodedRaw = base64url.decode(email);
        const parsed = await simpleParser(decodedRaw);
        const emailJson = {
            sender: parsed.from.text,
            body: parsed.text,
            subject: parsed.subject
        };

        console.log("Email received:", emailJson);

        const response = await sendMessage(SQS_INBOUND_QUEUE_URL, JSON.stringify(emailJson));
        console.log("Message sent to SQS:", response.MessageId);
    } catch (error) {
        console.error("Error processing email:", error);
    }
}

async function checkEmails() {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
        const res = await gmail.users.messages.list({ userId: 'me', q: 'is:unread' });
        const messages = res.data.messages || [];

        if (messages.length === 0) {
            console.log('No new emails');
            return;
        }

        for (const message of messages) {
            const msg = await gmail.users.messages.get({ userId: 'me', id: message.id, format: 'raw' });
            const email = msg.data.raw;
            if (email) {
                await processEmail(email);
            } else {
                console.error('Email content is null or undefined');
            }

            // Mark the email as read
            await gmail.users.messages.modify({
                userId: 'me',
                id: message.id,
                resource: { removeLabelIds: ['UNREAD'] }
            });
        }
    } catch (error) {
        console.error('Error checking emails:', error);
    }
}

// Call the checkEmails function directly
checkEmails();