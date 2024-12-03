const { Worker, isMainThread, parentPort } = require('worker_threads');

// Import the database module
const ReferenceToFutureDB = require('../../FutureDB/ReferenceToFutureDB');

class ProcessorThread {
    static database = ReferenceToFutureDB; // Static reference to your database

    constructor(GenericMessage, outMessagesQueue) {
        this.GenericMessage = GenericMessage; // Object containing address and body fields
        this.outMessagesQueue = outMessagesQueue; // A shared queue for processed messages
    }

    async run() {
        const { address, body } = this.GenericMessage;

        try {
            // Fetch addresses in the same group as `address`
            const addresses = await ProcessorThread.database.getAddressesByGroup(address);

            for (const addr of addresses) {
                const processedMessage = {
                    address: addr.address,
                    formatCode: addr.formatCode,
                    body: body
                };

                // Push the processed message to the outMessages queue
                this.outMessagesQueue.push(processedMessage);
            }
        } catch (error) {
            console.error("Error processing messages:", error);
        }
    }
}

// Worker thread logic
if (!isMainThread) {
    parentPort.on('message', async ({ GenericMessage, outMessagesQueue }) => {
        const processor = new ProcessorThread(GenericMessage, outMessagesQueue);
        await processor.run();
        parentPort.postMessage('Processing complete');
    });
}

// Example usage of ProcessorThread (on the main thread)
/*
const queue = []; // A simple shared queue; replace with a robust implementation if necessary

const GenericMessage = { address: 'group1', body: 'Hello, World!' };
const processor = new ProcessorThread(GenericMessage, queue);

(async () => {
    await processor.run();
    console.log('Queue after processing:', queue);
})();
*/

module.exports = ProcessorThread;
