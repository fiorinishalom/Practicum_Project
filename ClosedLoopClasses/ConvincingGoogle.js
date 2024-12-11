const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config({ path: '../secrets.env' });

// Load your client ID and client secret from the credentials file
const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback'; // Redirect URI you set in Google Console

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Scopes needed for IMAP access
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Step 1: Generate an authentication URL for the user to approve
function generateAuthUrl() {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Ensures you get a refresh token
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', url);
}

// Step 2: Get the tokens after the user has authorized
function getAccessToken(code) {
    oauth2Client.getToken(code, (err, tokens) => {
        if (err) {
            console.log('Error retrieving access token:', err);
            return;
        }
        oauth2Client.setCredentials(tokens);
        console.log('Tokens acquired:', tokens);

        // You can now use OAuth client to access Gmail API or IMAP
        listEmails();
    });
}

// Step 3: List emails (example of using the authorized credentials to interact with Gmail)
function listEmails() {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    gmail.users.messages.list({ userId: 'me' }, (err, res) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        const messages = res.data.messages;
        if (messages.length) {
            console.log('Messages:');
            messages.forEach((message) => {
                console.log(`- ${message.id}`);
            });
        } else {
            console.log('No messages found.');
        }
    });
}

// Step 4: Start the authorization process
generateAuthUrl();

// Now, run your app and use the authorization URL to manually authorize the app.
// After that, you will get a code to pass to getAccessToken().
// Prompt the user for the authorization code

rl.question('Enter the code from that page here: ', (code) => {
    getAccessToken(code);
    rl.close();
});
