const express = require('express');
const bodyParser = require('body-parser');
const redis = require('ioredis');

const app = express();
const client = redis.createClient();


app.use(bodyParser.json());

app.post('/api', (req, res) => {
  const { MsgType, OperationType, TenantId, OMSId, ClientID, ClientName, Remark } = req.body;

  // Check message type
  if (MsgType !== 1121) {
    return res.status(400).send('Invalid message type');
  }

  // Check operation type
  if (OperationType === 100 ) { 
    const key = `${TenantId}_${OMSId}:${ClientID}`; 
    const clientInfo = req.body;
    client.hmset(key, clientInfo, (err, reply) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error storing client info in Redis');
      } else {
        res.status(201).send('Client info stored successfully');
      }
    });
  } else if (OperationType === 101) { // Update order
    const key = `${TenantId}_${OMSId}:${ClientID}`;  // Modify key format
    const clientInfo = req.body;
    client.hmset(key, clientInfo, (err, reply) => {// Use client.hmset instead of hashName
      if (err) {
        console.error(err);
        res.status(500).send('Error updating order info in Redis');
      } else {
        res.status(200).send('Order info updated successfully');
      }
    });
  } else if (OperationType === 102) { // Delete client
    const key = `${TenantId}_${OMSId}:${ClientID}`; // Combine identifiers
    client.del(key, (err, reply) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error deleting client info from Redis');
      } else {
        if (reply === 1) {
          res.status(200).send('Client info deleted successfully');
        } else {
          res.status(404).send('Client info not found');
        }
      }
    });
  } else if (OperationType === 103) { 
    // Get client
    if (!ClientID) {
      return res.status(400).json({ error: 'ClientId is required' });
    }
    const key = `${TenantId}_${OMSId}:${ClientID}`;
    client.hgetall(key, (err, clientInfo) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (!clientInfo) {
        return res.status(404).json({ error: 'Client data not found' });
      }
      res.json(clientInfo);
    });
  } else if (OperationType === 104) { 
    client.keys('[0-9]_[0-9]:*', (err, keys) => {
      if (err) {
          console.error('Redis error:', err);
          return res.status(500).json({ error: 'Internal server error' });
      }
      if (!keys || keys.length === 0) {
          return res.status(404).json({ error: 'No records found' });
      }
      const getAllDataPromises = keys.map(key => {
          return new Promise((resolve, reject) => {
              client.hgetall(key, (err, data) => {
                  if (err) {
                      reject(err);
                  } else {
                      resolve(data);
                  }
              });
          });
      });
      Promise.all(getAllDataPromises)
          .then(results => {
              res.json(results);
          })
          .catch(err => {
              console.error('Redis error:', err);
              res.status(500).json({ error: 'Internal server error' });
          });
  });
  } else {
    res.status(400).send('Invalid operation type');
  }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
