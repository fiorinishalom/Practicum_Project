const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const OAUTH_CLIENT_ID = 'your-client-id';
const OAUTH_CLIENT_SECRET = 'your-client-secret';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const OAUTH_REFRESH_TOKEN = 'your-refresh-token';

const oAuth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: OAUTH_REFRESH_TOKEN });

async function sendEmail() {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'ChorusAside@gmail.com', // Your Gmail address
                clientId: OAUTH_CLIENT_ID,


                clientSecret: OAUTH_CLIENT_SECRET,
                refreshToken: OAUTH_REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
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
