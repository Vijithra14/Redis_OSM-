const readline = require('readline');
const Redis = require('ioredis');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const redis = new Redis();

rl.question('Enter the channel name: ', (channel) => {
  rl.question('Enter your message: ', (message) => {
    // Publish the message to the specified channel
    redis.publish(channel, message);
    console.log(`Published message "${message}" to channel "${channel}"`);
    rl.close();
  });
});
