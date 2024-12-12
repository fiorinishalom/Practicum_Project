const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Resolve the absolute path to the secrets.env file
const Secrets_path = path.resolve(__dirname, '../Secrets/secrets.env');

// Validate the path to the secrets.env file
if (!fs.existsSync(Secrets_path)) {
    throw new Error(`Secrets file not found at path: ${Secrets_path}`);
}

require('dotenv').config({ path: Secrets_path });

const { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REFRESH_TOKEN, EMAIL_USER } = process.env;

const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: OAUTH_REFRESH_TOKEN });

async function sendEmail() {
    try {
        const accessToken = await oauth2Client.getAccessToken();
        console.log('Access Token:', accessToken.token);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: EMAIL_USER, // Your Gmail address
                clientId: OAUTH_CLIENT_ID,
                clientSecret: OAUTH_CLIENT_SECRET,
                refreshToken: OAUTH_REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: '"CHORUS Team" <ChorusAside@gmail.com>',
            to: 'fiorini.shalom@gmail.com',
            subject: 'OAuth2 Test Email',
            text: 'Hello, this is a test email sent using OAuth2!',
            html: '<p><b>Hello</b>, this is a test email sent using <i>OAuth2</i>!</p>',
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent:', result.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

sendEmail();