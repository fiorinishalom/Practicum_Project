const emailListener = require('./Listeners/EmailListener.js');
const slackListener = require('./Listeners/SlackListener.js');
const databaseRemoteAccess = require('./Database/DatabaseRemoteAccess.js');
const processorPool = require('./Processor/ProcPool.js');

databaseRemoteAccess.restartRDSInstance();

// Call the 'begin' method from the EmailListener
emailListener.begin();  // This will run the 'begin' method defined in EmailListener.js

// Call the 'begin' method from the SlackListener
slackListener.begin();  // This will run the 'begin' method defined in SlackListener.js

//start processor and broadcasters
processorPool.begin();  // This will run the 'begin' method defined in ProcPool.js
