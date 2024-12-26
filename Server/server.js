const dbreqs = require("../Server/dbreqs");
const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000

app.use(cors({
  origin: '*'
}))

app.use(express.json());


// Your existing routes
app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.post('/groups', async (req, res) => {
    try {
        const id = req.body.id;
        const asides = await dbreqs.getAllAsidesOfUser(id);
        res.send(asides);
    } catch (error) {
        console.error('Error handling /groups request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});


app.post('/messages', async (req, res) => {
    try {
        const asideName = req.body.asideName; // Receive the asideName
        console.log('Received asideName:', asideName); // Log for debugging

        // Assuming `dbreqs.getMessagesByAsideName` is a method to fetch messages by asideName
        const messages = await dbreqs.getMessagesByAsideName(asideName);
        res.send(messages);
    } catch (error) {
        console.error('Error handling /messages request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})