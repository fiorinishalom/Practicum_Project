// Import the necessary modules from AWS SDK
const { RDSClient, DescribeDBInstancesCommand, StopDBInstanceCommand, RebootDBInstanceCommand} = require("@aws-sdk/client-rds");

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
        // Create the RebootDBInstanceCommand with the provided DB instance identifier
        const rebootCommand = new RebootDBInstanceCommand({
            DBInstanceIdentifier: dbInstanceIdentifier,
        });

        // Send the command to AWS RDS to reboot the instance
        const rebootData = await rdsClient.send(rebootCommand);

        console.log(`The RDS instance ${dbInstanceIdentifier} is now restarting. Status: ${rebootData.DBInstance.DBInstanceStatus}`);
    } catch (error) {
        console.error(`Error restarting the RDS instance ${dbInstanceIdentifier}:`, error);
    }
}



// Call the function with the RDS instance identifier
// Replace with your DB instance ID
stopRDSInstance(DB_NAME);
