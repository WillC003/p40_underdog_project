const twilio = require('twilio');

const accountSid = 'AC0d8a745a3d5d29919619e460e2f4812e'; // Replace with your Account SID
const authToken = 'a0e9f17f6e31f5c13190741e4adf27ae';   // Replace with your Auth Token
const client = new twilio(accountSid, authToken);

client.messages
  .create({
    body: 'Hello from Node.js!',
    from: '+13186618244', // Replace with your Twilio number
    to: '+13188054207'    // Replace with the recipient's number
  })
  .then(message => console.log(`Message sent: ${message.sid}`))
  .catch(error => console.error(error));