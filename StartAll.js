const emailListener = require('./Listeners/EmailListener.js');
const slackListener = require('./Listeners/SlackListener.js');
const databaseRemoteAccess = require('./Database/DatabaseRemoteAccess.js');

databaseRemoteAccess.restartRDSInstance();

// Call the 'begin' method from the EmailListener
emailListener.begin();  // This will run the 'begin' method defined in EmailListener.js

// Call the 'begin' method from the SlackListener
slackListener.begin();  // This will run the 'begin' method defined in SlackListener.js


