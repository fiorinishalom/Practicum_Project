const nodemailer = require('nodemailer');
require("dotenv").config(); // Ensure to load your environment variables

class SendToOutboundEmail {
    constructor() {
        // Configure Nodemailer
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'fiorini.shalom@gmail.com', // Your Gmail address
                pass: process.env.EMAIL_APP_PASS,  // The app password generated
            },
        });
    }

    // Function to send an email
    async sendMessage(jsonBlob) {
        console.log("Sending message to Email:", jsonBlob);
        const emailMessage = {
            PSA: jsonBlob.PSA,
            MSG: jsonBlob.MSG,
        };

        const mailOptions = {
            from: 'fiorini.shalom@gmail.com',  // Sender's email
            to: jsonBlob.recipient || 'default@example.com', // Recipient's email
            subject: 'Your Custom Subject', // Email subject
            text: emailMessage.MSG || 'No Body Provided', // Plain text body
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.response);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
}

module.exports = SendToOutboundEmail;
