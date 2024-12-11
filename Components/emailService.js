// emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../Components/secrets.env' });

const { EMAIL_USER, EMAIL_PASSWORD } = process.env;

// Create a transporter object
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your email provider
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
    },
});

// Function to send an email
const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: EMAIL_USER,
        to,
        subject,
        text,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendEmail };
