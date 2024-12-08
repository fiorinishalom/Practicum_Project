require('dotenv').config({ path: './secrets.env' });
const express = require('express');
const Imap = require('imap');
const {} = require('util');
const { email_port } = require('../Components/PortNumbers');
const app = express();
const port = email_port;

// Configure IMAP connection details
const imap = new Imap({
    user: process.env.EMAIL_USER, // Your email address
    password: process.env.EMAIL_PASSWORD, // Your email password
    host: process.env.IMAP_HOST, // IMAP server address
    port: 993, // IMAP port for secure connection
    tls: true, // Use TLS
});

const { simpleParser } = require('mailparser');
const AWS = require('aws-sdk');
const GenericMessageObject = require('../Components/GenericMessageObject');
const queueUrl = process.env.SQS_QUEUE_URL;

// Configure AWS SQS
AWS.config.update({ region: 'us-east-1' });
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

async function processEmail(email) {
    try {
        const parsed = await simpleParser(email);
        const sender = parsed.from.text;
        const body = parsed.text;
        const aside_ID = parsed.subject;

        const message = new GenericMessageObject(sender, body, aside_ID);

        const params = {
            MessageBody: JSON.stringify(message),
            QueueUrl: queueUrl
        };

        sqs.sendMessage(params, (err, data) => {
            if (err) {
                console.error("Error sending message to SQS:", err);
            } else {
                console.log("Message sent to SQS:", data.MessageId);
            }
        });
    } catch (error) {
        console.error("Error processing email:", error);
    }
}

// Function to check emails and delete them after processing
function checkEmails() {
    // Event listener for when the IMAP connection is ready
    imap.once('ready', function () {

        // Open the inbox folder (false indicates not read-only, so you can modify it)
        imap.openBox('INBOX', false, function (err, box) {
            if (err) throw err; // Handle any errors when opening the inbox

            // Listen for new emails by subscribing to the 'mail' event
            imap.on('mail', function () {

                // Search for unseen (unread) emails in the inbox
                imap.search(['UNSEEN'], function (err, results) {
                    if (err || results.length === 0) {
                        console.log('No new emails'); // If no unread emails are found, log a message
                        return; // Exit the function if no new emails
                    }

                    // Fetch the emails that are found based on the search criteria (UNSEEN)
                    const fetch = imap.fetch(results, { bodies: '' });

                    // Handle each email message returned
                    fetch.on('message', function (msg, seqno) {
                        // When the email body is received, collect the body content
                        msg.on('body', function (stream) {
                            let body = '';
                            stream.on('data', function (chunk) {
                                body += chunk.toString(); // Append each chunk of the email body
                            });
                            // When the entire body is received, process the email
                            stream.on('end', function () {
                                processEmail(body); // Trigger your email processing function here
                            });
                        });

                        // Once the message is fully processed, mark it for deletion
                        msg.once('end', function () {
                            // Add the \\Deleted flag to the email to mark it for deletion
                            imap.addFlags(seqno, '\\Deleted', function () {
                                console.log('Email marked for deletion'); // Log the action
                            });
                        });
                    });

                    // After all messages have been processed, expunge the inbox
                    fetch.once('end', function () {
                        // Expunge (permanently delete) the emails marked with the deleted flag
                        imap.expunge(function (err) {
                            if (err) console.log('Error expunging:', err); // Handle any errors
                            else console.log('Emails deleted'); // Log successful deletion
                        });
                    });
                });
            });

            // Start idling to listen for new emails (keeps the connection alive and waits for new mail)
            imap.idle();
        });
    });

    // Handle any connection errors
    imap.once('error', function (err) {
        console.log(err); // Log any errors that occur during the IMAP connection
    });

    // Handle the end of the connection
    imap.once('end', function () {
        console.log('Connection ended'); // Log when the connection to the server ends
    });

    // Establish the IMAP connection
    imap.connect();
}

// Set up a route to trigger email check manually or on a schedule
app.get('/check-emails', (req, res) => {
    checkEmails();
    res.send('Checking emails...');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});