const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const redis = require('redis');
const app = express();
var server = require('http').createServer(app)

const cors = require('cors');
const neo4j = require('neo4j-driver');
dotenv.config();

const personRoutes = require('./routes/person');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const commentRoutes = require('./routes/comment');
const imageRoutes = require('./routes/image');
const chatRoutes = require('./routes/chat');
const roomRoutes = require('./routes/chatRoom');

const Person = require('./models/person');
let { creds } = require("./config/credentials");
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(creds.neo4jusername, creds.neo4jpw));

let client = redis.createClient();
client.on('connect', function () {
    console.log('Konektovano sa Redis')
})

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/person', personRoutes);
app.use('/auth', authRoutes);
app.use('/post', postRoutes);
app.use('/comment', commentRoutes);
app.use('/image', imageRoutes);
app.use('/chat', chatRoutes);
app.use('/room', roomRoutes);

const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const util = require('util')
const redisUrl = 'redis://127.0.0.1:6379';
const clientR = redis.createClient(redisUrl);
clientR.get = util.promisify(clientR.get);
io.on("connection", (socket) => {
    clientR.set("socket:" + socket.handshake.query.userId, socket.id);
    socket.on("like", (socket) => {
        clientR.get(`socket:${socket.liked}`).then(socketId => {
            io.to(socketId).emit("liked", socket);
        })
    })
    socket.on("dislike", (socket) => {
        clientR.get(`socket:${socket.disliked}`).then(socketId => {
            io.to(socketId).emit("disliked", socket);
        })
    })
    socket.on("comment", (socket) => {
        clientR.get(`socket:${socket.commented}`).then(socketId => {
            io.to(socketId).emit("commented", socket);
        })
    })
    socket.on("chat", async (socket) => {
        const session = driver.session();
        const persons = await session.run('MATCH (n:Person {username:$username}) RETURN n', {
            username: socket.to
        })
        session.close();
        const Data = persons.records.map(r => new Person(r.get('n')))
        clientR.get(`socket:${Data[0].id}`).then(socketId => {
            io.to(socketId).emit("newMessage", socket);
        })
    })
});

server.listen(8000, () => {
    console.log("Jos jedan server");
})

const port = 8080;
app.listen(port, function () {
    console.log('Server radi na portu ' + port)
})


module.exports = app;

