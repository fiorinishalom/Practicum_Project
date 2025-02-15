const {Worker} = require('worker_threads');
const path = require('path');
const SQSClient = require("../Components/SQSClient");

// Resolve the absolute path to the secrets.env file
const Secrets_path = path.resolve(__dirname, '../Secrets/secrets.env');

require('dotenv').config({path: Secrets_path});

// Now you can access the SQS_INBOUND_QUEUE_URL and other environment variables
const {SQS_INBOUND_QUEUE_URL} = process.env;

const workerPath = path.resolve(__dirname, 'ProcWorker.js');
const maxThreads = 10;
let activeThreads = 0;

const createWorker = () => {
    if (activeThreads < maxThreads) {
        try {
            const worker = new Worker(workerPath);
            activeThreads++;

            worker.on('message', (message) => {
                if (message === 'not-empty') {
                    if (activeThreads < maxThreads) {
                        createWorker();
                    }
                } else if (message === 'empty') {
                    activeThreads--;
                }
            });

            worker.on('exit', (code) => {
                activeThreads--;
                if (code !== 0) {
                    console.error(`Worker stopped with exit code ${code}. Restarting worker...`);
                    createWorker();
                }
            });

            worker.on('error', (error) => {
                activeThreads--;
                console.error(`Worker error: ${error.message}. Restarting worker...`);
                createWorker();
            });
        } catch (error) {
            console.error(`Failed to create worker: ${error.message}`);
        }
    }
};

const checkQueueAndManageWorkers = async () => {
    setInterval(async () => {
        if (activeThreads === 0) {
            console.log("No active proc workers. Checking the inbound queue...");
            const messages = await SQSClient.receiveMessages(SQS_INBOUND_QUEUE_URL, 1, 10);

            if (messages.length > 0) {
                console.log("Messages found in the inbound queue. Dispatching a proc worker...");
                createWorker();
            } else {
                console.log("Inbound Queue is empty. Waiting for new messages...");
            }
        }
    }, 2000);
};

function begin() {
    checkQueueAndManageWorkers();
}
module.exports = {begin};