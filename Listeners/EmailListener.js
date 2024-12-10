require('dotenv').config({ path: '../secrets.env' });
const express = require('express');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const SQSClient = require('../Components/SQSClient');
const { email_port } = require('../Components/PortNumbers');
const app = express();
const port = email_port;

// Load environment variables from the .env file
const {
    SQS_QUEUE_URL,
    EMAIL_USER,
    EMAIL_PASSWORD,
    IMAP_HOST
} = process.env;

// Ensure all required environment variables are loaded
if (!SQS_QUEUE_URL || !EMAIL_USER || !EMAIL_PASSWORD || !IMAP_HOST) {
    throw new Error('Missing required environment variables');
}

// Configure IMAP connection details
const imap = new Imap({
    user: EMAIL_USER,
    password: EMAIL_PASSWORD,
    host: IMAP_HOST,
    port: 993,
    tls: true,
});

// Create an SQS client instance
const sqsClient = new SQSClient(SQS_QUEUE_URL);

async function processEmail(email) {
    try {
        const parsed = await simpleParser(email);
        const emailJson = {
            sender: parsed.from.text,
            body: parsed.text,
            subject: parsed.subject
        };

        const response = await sqsClient.send(emailJson);
        console.log("Message sent to SQS:", response.MessageId);
    } catch (error) {
        console.error("Error processing email:", error);
    }
}

function checkEmails() {
    imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
            if (err) throw err;

            imap.on('mail', () => {
                imap.search(['UNSEEN'],  (err, results)=> {
                    if (err || results.length === 0) {
                        console.log('No new emails');
                        return;
                    }

                    const fetch = imap.fetch(results, { bodies: '' });

                    fetch.on('message', (msg, seqno) => {
                        msg.on('body', (stream) => {
                            let body = '';
                            stream.on('data', function (chunk) {
                                body += chunk.toString();
                            });
                            stream.on('end', function () {
                                processEmail(body);
                            });
                        });

                        msg.once('end', () => {
                            imap.addFlags(seqno, '\\Deleted', function () {
                                if (err) {
                                    console.error('Error marking email for deletion:', err);
                                } else {
                                    console.log('Email marked for deletion');
                                }
                            });
                        });
                    });

                    fetch.once('end', function () {
                        imap.expunge(function (err) {
                            if (err) console.log('Error expunging:', err);
                            else console.log('Emails deleted');
                        });
                    });
                });
            });

            imap.idle();
        });
    });

    imap.once('error', function (err) {
        console.log(err);
    });

    imap.once('end', function () {
        console.log('Connection ended');
    });

    imap.connect();
}

app.get('/check-emails', (req, res) => {
    checkEmails();
    res.send('Checking emails...');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});