const express = require('express');
const bodyParser = require('body-parser');
const redis = require('ioredis');

const app = express();
const order = new redis();

// Middleware
app.use(bodyParser.json());

// Add, Update, Delete Order Info
app.post('/order', (req, res) => {
  const { MsgType, OperationType, TenantId, OMSId, OrderType, Token, OrderId, OrderPrice, OrderQty, ClientID, ClientName, Remark } = req.body;

  // Check message type
  if (MsgType !== 1120) {
    return res.status(400).send('Invalid message type');
  }

  // Check operation type
  if (OperationType === 100) { // Add order
    const key = `${TenantId}_${OMSId}_${ClientID}_${Token}:${OrderId}`; // Modify key format
    const orderInfo =req.body;
    order.hmset(key, orderInfo, (err,reply) => { // Use client.hmset instead of hashName
      if (err) {
        console.error(err);
        res.status(500).send('Error storing order info in Redis');
      }
      else {
        res.status(201).send('Order info stored successfully');
      }
    });
  } else if (OperationType === 101) { // Update order
    const key = `${TenantId}_${OMSId}_${ClientID}_${Token}:${OrderId}`; // Modify key format
    const orderInfo = req.body;
    order.hmset(key, orderInfo, (err,reply) => { // Use client.hmset instead of hashName
      if (err) {
        console.error(err);
        res.status(500).send('Error updating order info in Redis');
      }
      else {
        res.status(200).send('Order info updated successfully');
      }
    });
  } else if (OperationType === 102) {
    const { TenantId, OMSId, ClientID, Token, OrderId } = req.body;
    const key = `${TenantId}_${OMSId}_${ClientID}_${Token}:${OrderId}`; // Modify key format
    order.del(key, (err,reply) => { // Use client.del to delete the key
      if (err) {
        console.error(err);
        res.status(500).send('Error deleting order info from Redis');
      } 
      else {
        if (reply === 1) {
          res.status(200).send('Order info deleted successfully');
        } else {
          res.status(404).send('Order info not found');
        }
      }
    });
  } else if (OperationType === 103) {
    if (!OrderId) {
      return res.status(400).json({ error: 'OrderId is required' });
    }
    const key = `${TenantId}_${OMSId}_${ClientID}_${Token}:${OrderId}`; 
    order.hgetall(key, (err, orderData) => { 
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (!orderData) {
        return res.status(404).json({ error: 'Order data not found' });
      }
      res.json(orderData);
    });
  } else if(OperationType===104){
    order.keys('[0-9]_[0-9]_[0-9]*', (err, keys) => {
      if (err) {
          console.error('Redis error:', err);
          return res.status(500).json({ error: 'Internal server error' });
      }
      if (!keys || keys.length === 0) {
          return res.status(404).json({ error: 'No records found' });
      }
      const getAllDataPromises = keys.map(key => {
          return new Promise((resolve, reject) => {
            order.hgetall(key, (err, data) => {
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
  });}else {
    res.status(400).send('Invalid operation type');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
