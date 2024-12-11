const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const Secrets_path = path.resolve(__dirname, '../Secrets/secrets.env');

require('dotenv').config({ path: Secrets_path });

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost:3000/oauth2callback');

if (REFRESH_TOKEN) {
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    oauth2Client.getAccessToken((err, token) => {
        if (err) {
            console.error('Error retrieving access token:', err);
            // Reauthorize the app
            generateAuthUrl();
        } else {
            console.log('Access token is valid:', token);
            // Proceed with the existing credentials
        }
    });
} else {
    // Reauthorize the app
    generateAuthUrl();
}

function generateAuthUrl() {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.send'],
    });
    console.log('Authorize this app by visiting this url:', url);
}