// Import the necessary modules from AWS SDK
const {
    RDSClient,
    DescribeDBInstancesCommand,
    StopDBInstanceCommand,
    RebootDBInstanceCommand, StartDBInstanceCommand
} = require("@aws-sdk/client-rds");

const dotenv = require('dotenv');

// Load environment variables from both .env files
dotenv.config({path: '../Secrets/secrets.env'});

// Load environment variables from the .env file
const {AWS_REGION, DB_NAME} = process.env;

// Set up the RDS client
const rdsClient = new RDSClient({
    region: AWS_REGION, // Replace with your region
});

async function checkRDSInstanceStatus(dbInstanceIdentifier) {
    try {
        // Create the DescribeDBInstancesCommand with the provided DB instance identifier
        const command = new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbInstanceIdentifier,
        });

        // Send the command to AWS RDS and get the response
        const data = await rdsClient.send(command);

        // Extract the DB instance status
        const dbInstanceStatus = data.DBInstances[0].DBInstanceStatus;

        console.log(`DB Instance status: ${dbInstanceStatus}`);

        // Check if the status is 'available' (running)
        if (dbInstanceStatus === "available") {
            console.log("The RDS instance is running.");
        } else {
            console.log("The RDS instance is not running.");
        }
    } catch (error) {
        console.error("Error checking RDS instance status:", error);
    }
}

async function stopRDSInstance(dbInstanceIdentifier) {
    try {
        // Create the StopDBInstanceCommand with the provided DB instance identifier
        const stopCommand = new StopDBInstanceCommand({
            DBInstanceIdentifier: dbInstanceIdentifier,
        });

        // Send the command to AWS RDS to stop the instance
        const stopData = await rdsClient.send(stopCommand);

        console.log(`The RDS instance ${dbInstanceIdentifier} is now stopping. Status: ${stopData.DBInstance.DBInstanceStatus}`);
    } catch (error) {
        console.error(`Error stopping the RDS instance ${dbInstanceIdentifier}:`, error);
    }
}

async function restartRDSInstance(dbInstanceIdentifier) {
    try {
        // First, check the current status of the DB instance
        const describeCommand = new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbInstanceIdentifier,
        });

        const describeData = await rdsClient.send(describeCommand);
        const dbInstanceStatus = describeData.DBInstances[0].DBInstanceStatus;

        console.log(`Current DB instance status: ${dbInstanceStatus}`);

        // If the instance is stopped, start it
        if (dbInstanceStatus === 'stopped') {
            console.log("The RDS instance is stopped. Starting the instance...");

            // Start the DB instance
            const startCommand = new StartDBInstanceCommand({
                DBInstanceIdentifier: dbInstanceIdentifier,
            });

            const startData = await rdsClient.send(startCommand);
            console.log(`The RDS instance ${dbInstanceIdentifier} is now starting. Status: ${startData.DBInstance.DBInstanceStatus}`);
        } else {
            // If the instance is not stopped, reboot it
            console.log("The RDS instance is already running.");
        }
    } catch (error) {
        console.error(`Error restarting or starting the RDS instance ${dbInstanceIdentifier}:`, error);
    }
}


// Call the function with the RDS instance identifier
module.exports = {restartRDSInstance};
