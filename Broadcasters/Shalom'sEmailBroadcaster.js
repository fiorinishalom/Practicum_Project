
const nodemailer = require('nodemailer');
const { ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const { SQS_OUTBOUND_QUEUE_URL,EMAIL_APP_PASS } = process.env;

// Function to configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'fiorini.shalom@gmail.com', // Your Gmail address
        pass: EMAIL_APP_PASS,    // The app password generated
    },
});

// Function to send an email
const sendEmail = async (recipient, subject, body) => {
    try {
        const mailOptions = {
            from: 'fiorini.shalom@gmail.com',  // Sender's email
            to: recipient,                // Recipient's email
            subject: subject || 'No Subject Provided',  // Email subject
            text: body || 'No Body Provided',           // Plain text body
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Function to query messages from the SQS outbound queue
const queryOutboundQueue = async () => {
    try {
        const receiveCommand = new ReceiveMessageCommand({
            QueueUrl: SQS_OUTBOUND_QUEUE_URL,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 10,
        });

        const response = await sqsClient.send(receiveCommand);

        if (response.Messages && response.Messages.length > 0) {
            const message = response.Messages[0];
            console.log("Message received:", message.Body);

            // Parse the JSON blob from the message body
            const parsedMessage = JSON.parse(message.Body);

            const recipient = parsedMessage.emailAddress;
            const body = parsedMessage.body;

            // Send the email
            await sendEmail(recipient, 'Your Custom Subject', body);

            // Delete the message after processing
            await deleteMessage(message.ReceiptHandle);
        } else {
            console.log("No messages available in the outbound queue.");
        }
    } catch (error) {
        console.error("Error querying the outbound queue:", error);
    }
};

// Function to delete a processed message from the queue
const deleteMessage = async (receiptHandle) => {
    try {
        const deleteCommand = new DeleteMessageCommand({
            QueueUrl: SQS_OUTBOUND_QUEUE_URL,
            ReceiptHandle: receiptHandle,
        });

        await sqsClient.send(deleteCommand);
        console.log("Message deleted successfully.");
    } catch (error) {
        console.error("Error deleting message:", error);
    }
};

// Query the outbound queue
queryOutboundQueue();
