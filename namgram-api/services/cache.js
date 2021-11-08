const redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.get = util.promisify(client.get);

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey))
    }
}