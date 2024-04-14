const readline = require('readline');
const Redis = require('ioredis');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const redis = new Redis();

rl.question('Enter the channel name you want to subscribe to: ', (channel) => {
  console.log(`Subscribed to channel "${channel}"`);

  // Subscribe to the specified channel
  redis.subscribe(channel, (err, count) => {
    if (err) {
      console.error(`Error subscribing to channel "${channel}":`, err);
      process.exit(1);
    }

    console.log(`Subscribed to ${count} channel(s)`);
  });

  // Listen for messages on the subscribed channel
  redis.on('message', (msgChannel, message) => {
    if (msgChannel === channel) {
      console.log(`Received message from channel "${channel}": ${message}`);
    }
  });
});
rl.on('close', () => {
  redis.quit();
  console.log('Exiting...');
});
