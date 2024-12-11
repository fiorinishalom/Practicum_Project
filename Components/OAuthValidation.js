const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const Secrets_path = path.resolve(__dirname, '../Secrets/secrets.env');

require('dotenv').config({ path: Secrets_path });

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;

// Ensure the environment variables are loaded from the correct file
if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Environment variables not loaded from Secrets/secrets.env');
}

const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.send'];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function generateAuthUrl() {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });
    console.log('Authorize this app by visiting this url:', url);
}

function getAccessToken(code) {
    oauth2Client.getToken(code, (err, tokens) => {
        if (err) {
            console.error('Error retrieving access token:', err);
            rl.close();
            return;
        }
        oauth2Client.setCredentials(tokens);
        console.log('Tokens acquired:', tokens);

        try {
            // Read the secrets.env file
            let envFileContent = fs.readFileSync(Secrets_path, 'utf8');

            // Remove the existing OAUTH_REFRESH_TOKEN line
            envFileContent = envFileContent.split('\n').filter(line => !line.startsWith('OAUTH_REFRESH_TOKEN')).join('\n');

            // Append the new refresh token
            envFileContent += `\nOAUTH_REFRESH_TOKEN=${tokens.refresh_token}`;

            // Write the updated content back to the secrets.env file
            fs.writeFileSync(Secrets_path, envFileContent);
            console.log('Refresh token saved to secrets.env');
        } catch (fileErr) {
            console.error('Error reading or writing secrets.env file:', fileErr);
        }
    });
}

generateAuthUrl();

rl.question('Enter the code from that page here: ', (code) => {
    getAccessToken(code);
    rl.close();
});