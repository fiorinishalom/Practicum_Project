const SQSClient = require("../Components/SQSClient");
const dbConnection = require("../Components/DB_Conn");
const getMessageSender = require("../SendingToOutboundQueue/getMessageSender");
require("dotenv").config({path: "../Secrets/secrets.env"});

const {SQS_INBOUND_QUEUE_URL, SQS_OUTBOUND_QUEUE_URL} = process.env;

// Function to query PSAs and platforms for Aside members
const getPSAsAndPlatformsOfAsideMembers = async (asideId) => {
    const query = `
        SELECT Accounts.PSA, Accounts.Platform
        FROM Accounts
                 JOIN UserAside ON Accounts.UserID = UserAside.UserID
                 JOIN Aside ON UserAside.AsideId = Aside.AsideId
        WHERE Aside.AsideId = ?;
    `;

    console.log('About to check DB for Aside ID:', asideId);
    const rows = await dbConnection.execute(query, [asideId]); // Call execute directly
    console.log('Rows retrieved from database:', rows); // Log the rows

    // Ensure rows is an array before mapping
    if (Array.isArray(rows)) {
        return rows.map(row => ({PSA: row.PSA, platform: row.Platform}));
    } else {
        console.error('Expected rows to be an array, but received:', rows);
        return []; // Return an empty array if rows is not an array
    }
};

// function to add a user in the database of specified aside.
const addRegUser = async (platform, psa, asideId) => {
    try {
        const rows = await dbConnection.executeAddUser(platform, psa, asideId);
        console.log('User registration successful');
        return rows;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};
// method to remove user
const removeRegUser = async (sender, asideId) => {
    try {
        // Call the function to remove the user
        const affectedRows = await dbConnection.executeRemoveUser(sender, asideId);

        if (affectedRows === 2) {
            console.log(`User  removed successfully.`);
        } else if (affectedRows > 0) {
            console.log(`User wasn't deleted properly`);
        } else {
            console.log(`No user found with ID ${sender} and ${asideId}.`);
        }

    } catch (error) {
        console.error("Error removing registered user:", error);
            }
};

const platformFinder = (userCommand) => {
    let psa;
    switch (true) {
        case userCommand.includes("slack"):
            psa = "Slack";
            return psa;
        case userCommand.includes("email"):
            psa = "Email";
            return psa;
        default:
            return "Unknown"; // Optional: handle cases where no match is found
    }
}

// Process message
const processMessage = async () => {
    console.log("Checking for messages in the inbound queue...");

    // Receive a message from the SQS queue
    const messages = await SQSClient.receiveMessages(SQS_INBOUND_QUEUE_URL, 1, 10); // Receive 1 message, wait for 10 seconds

    if (messages.length === 0) {
        console.log("No messages received.");
        return;
    }

    const message = messages[0];
    const {Body, ReceiptHandle} = message;

    try {
        // Parse the message body
        const parsedBody = JSON.parse(Body); // First parse to handle escaped JSON
        const {sender, body: messageBody, subject: asideInfo} = parsedBody; // Extract required fields
        const asideIdInt = parseInt(asideInfo, 10); //
        console.log(`Received Sender: ${sender}, AsideID: ${asideIdInt}, Message: ${messageBody}`);


        const userCommand = messages.toLowerCase();


        // deciding what processing needs to occur based on email
        if (userCommand.contains("#join")) {
            const getPlatform = await platformFinder(userCommand);
            await addRegUser(sender, getPlatform, asideIdInt);
        } else if (userCommand.contains("#stop")) {
            await removeRegUser(sender, asideIdInt);
        } else {


            // Query the PSAs and platforms for all Aside members using the subject as the AsideID
            const psaData = await getPSAsAndPlatformsOfAsideMembers(asideIdInt);
            console.log(`Retrieved PSA data for Aside ${asideIdInt}:`, psaData);


            // Send messages to each PSA based on their platform
            for (const {PSA, platform} of psaData) {

                const outJsonBlob = {
                    Platform: platform,
                    PSA: PSA,
                    MSG: messageBody
                };

                await SQSClient.sendMessage(SQS_OUTBOUND_QUEUE_URL, outJsonBlob);

                // const sender = getMessageSender(platform); // Get platform-specific sender
                // const jsonBlob = {PSA, MSG: messageBody};
                //
                // console.log(`Sending message to PSA ${PSA} on platform ${platform}`);
                // await sender.sendMessage(jsonBlob); // Send the message using the platform-specific sender
            }
        }

        // Delete the message from the SQS after processing
        await SQSClient.deleteMessage(SQS_INBOUND_QUEUE_URL, ReceiptHandle);
        console.log("Processed and deleted the message from SQS.");
    } catch (error) {
        console.error(`Error processing message: ${error.message}`);
    }
};


(async () => {
    try {
        await processMessage();
    } catch (error) {
        console.error("Error processing message:", error.message);
    }
})();
