const keys = require('./keys');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const redis = require('redis');
// Postgress server setup
const { Pool } = require('pg');

// app receives all http requests.
const app = express();

// takes care of cross site scripting issues
app.use(cors());

// takes the body of http messages and converts it to json
app.use(bodyParser.json());

console.log(`Here are the keys: ${keys.pgUser}, ${keys.pgHost}, ${keys.pgDatabase}, ${keys.pgPassword},${keys.pgPort}`);

const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});

console.log('We have passed Pool instantiation.');

pgClient.on('error', () => console.log('Lost PG connection.'));
console.log('Added on error.');

pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err => {
	    console.log('Error creating table:');
	    console.log(err)
    });
console.log('Queried table.');


const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
console.log('Connected to redis client.');

const redisPublisher = redisClient.duplicate();

app.get('/', (req, res) => {
    console.log('Hitting the hi');
    res.send('hi');
});

let showValues = async () => {
    const values = await pgClient.query('SELECT * from values');
    console.log('What are the values: ');
    console.dir(values);

}

app.get('/values/all', async (req, res) => {
    console.log('Requesting all');
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    console.log(`Current values `);
    redisClient.hgetall('values', (err, values) => {
        console.log('On return the current values are:');
        console.dir(values);
        res.send(values);
    })
});

app.post('/values', (req, res) => {
    let index = req.body.index;
    console.log(`Posting values: ${index}`);

    if (parseInt(index) > 40) {
        return res.status(422).send('Index is too high.');
    }

    if(!index) {
        console.log('Undefined or zero index.');
        index = 1;
    }

    try {
        redisClient.hset('values', index, 'Nothing yet!');
        redisPublisher.publish('insert', index);
        pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
    } catch(e) {
        console.error('Could not publish value.');
    }

    showValues();


    res.send({working: true});
});


app.listen(5000, err => {
    console.log('Server listening on port 5000');
})
