const keys = require('./keys');
const redis = require('redis');

console.log('\n\n\nWhat env variables do we have?');
console.dir(process.env);

console.log('\n\n\nWorkers keys');
console.dir(keys);

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});


const sub = redisClient.duplicate();

function fib(index) {
    if (index < 2) {
        return 1;
    }
    return fib(index - 1) + fib(index - 2);
}

sub.on('message', (channel, message) => {
    console.log('Got a message.');
    try {
        redisClient.hset('values', message, fib(parseInt(message)));
    } catch(e) {
        console.error('Error in Workers on message command.');
    }
});

sub.subscribe('insert');

