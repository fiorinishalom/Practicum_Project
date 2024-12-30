const dbreqs = require("../Server/dbreqs");
const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000

app.use(cors({
  origin: '*'
}))

app.use(express.json());


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
        const asideId = req.body.asideId;
        const messages = await dbreqs.getMessagesByAsideName(asideId);
        res.send(messages);
    } catch (error) {
        console.error('Error handling /messages request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.post('/checkLogin', async (req, res) => {
    try {
        const { username, password } = req.body;
    
         const login = await dbreqs.checkLogin(username, password);

        console.log(login)


        if (login && login.length > 0) {
            res.status(200).send({ status: 200, data: login[0] });
        } else {
            res.status(400).send({ status: 400, data: null });
        }
    } catch (error) {
        console.error('Error handling /messages request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

//add new messages to a given aside
app.post('/addMessage', async (req, res) => {
    try {
        const { text, asideId, userId } = req.body;

        console.log('Received message:', text, 'for asideId:', asideId, 'from user:', userId);
        
        await dbreqs.insertMessage(userId, asideId, text); 
        
        res.status(200).send({ status: 200, message: 'Message added successfully' });
    } catch (error) {
        console.error('Error handling /addMessage request:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
