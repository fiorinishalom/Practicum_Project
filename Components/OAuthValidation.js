const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
require('dotenv').config({ path: '../secrets.env' });

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function generateAuthUrl() {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', url);
}

function getAccessToken(code) {
    oauth2Client.getToken(code, (err, tokens) => {
        if (err) {
            console.log('Error retrieving access token:', err);
            return;
        }
        oauth2Client.setCredentials(tokens);
        console.log('Tokens acquired:', tokens);

        // Save the refresh token to the secrets.env file
        fs.appendFileSync('../secrets.env', `\nOAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('Refresh token saved to secrets.env');
    });
}

generateAuthUrl();

rl.question('Enter the code from that page here: ', (code) => {
    getAccessToken(code);
    rl.close();
});