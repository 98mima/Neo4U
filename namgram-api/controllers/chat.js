const util = require('util')
const redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
//client.get = util.promisify(client.get);
var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
const Person = require('../models/person');
let { creds } = require("./../config/credentials");
let neo4j = require('neo4j-driver');
const _ = require('lodash');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(creds.neo4jusername, creds.neo4jpw));

var chatters = []
var chat_messages = []
var mess = []

function _manyPeople(neo4jResult) {
    return neo4jResult.records.map(r => new Person(r.get('person')))
}

// client.once('ready', function () {
//     //flush Redis
//     //client.flushdb();
//     client.get('chat_users', function (err, reply) {
//         if (reply) {
//             chatters = JSON.parse(reply)
//         }
//     })
//     client.get('chat_app_messages', function (err, reply) {
//         if (reply) {
//             chat_messages = JSON.parse(reply)
//         }
//     })
// })

exports.getMessages = async (req, res) => {
    try {
        var username1 = req.params.username1
        var username2 = req.params.username2

        const users = []
        users.push(username1)
        users.push(username2)
        users.sort()

        let Data = []
        const key = JSON.stringify(Object.assign({}, { user1: users[0] }, { user2: users[1] }, { collection: "messages" }));
        client.get(key, function (err, reply) {
            if (reply) {
                Data = JSON.parse(reply)
                return res.status(200).json(Data)
            }
            else {
                return res.status(200).json("nema poruka")
            }
        })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}
exports.getActive = async (req, res) => {
    try {
        let keyA = JSON.stringify(Object.assign({}, { user: req.params.username }, { collection: "chatters" }));
        let chatters = []
        console.log(keyA)
        client.get(keyA, function (err, reply) {
            if (reply) {
                chatters = JSON.parse(reply)
                return res.json({ "chatters": chatters })
            }
            else {
                chatters = []
                return res.json({ "chatters": chatters })
            }
        })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}

exports.joinChat = async (req, res) => {
    try {
        let session = driver.session();
        const persons = await session.run('MATCH (n:Person {username: $username})<--(person) RETURN person', {
            username: req.body.username
        })
        session.close();
        const followers = _manyPeople(persons)

        followers.forEach(follower => {
            let active = []
            const keyActive = JSON.stringify(Object.assign({}, { user: follower.username }, { collection: "chatters" }));
            client.get(keyActive, function (err, reply) {
                if (reply) {
                    active = JSON.parse(reply)
                    if (active.indexOf(follower.username) == -1) {
                        active.push(req.body.username)
                        client.set(keyActive, JSON.stringify(active))
                        client.expire(keyActive, 180);
                    }
                }
                else {
                    client.set(keyActive, JSON.stringify(active))
                }
            })
        })
        var username = req.body.username
        var username2 = req.body.username2
        const users = []
        users.push(username)
        users.push(username2)
        users.sort()

        let Data = []
        const key = JSON.stringify(Object.assign({}, { user1: users[0] }, { user2: users[1] }, { collection: "messages" }));
        client.get(key, function (err, reply) {
            if (reply) {
                Data = JSON.parse(reply)
                return res.status(200).json({
                    "messages": Data,
                    "status": "OK"
                })
            }
            else {
                return res.status(200).json([])
            }
        })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}

exports.leaveChat = async (req, res) => {
    try {
        let session = driver.session();
        const persons = await session.run('MATCH (n:Person {username: $username})<--(person) RETURN person', {
            username: req.body.username
        })
        session.close();
        const followers = _manyPeople(persons)

        followers.forEach(follower => {
            let active = []
            const keyActive = JSON.stringify(Object.assign({}, { user: follower.username }, { collection: "chatters" }));
            client.get(keyActive, function (err, reply) {
                if (reply) {
                    active = JSON.parse(reply)
                    console.log(active)
                    active.splice(active.indexOf(req.body.username), 1)
                    client.set(keyActive, JSON.stringify(active))
                }
            })
        });

        res.json({ "status": "OK" })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}

exports.sendMessage = async (req, res) => {
    try {
        var usernameSender = req.body.usernameSender
        var usernameReceiver = req.body.usernameReceiver
        var message = req.body.message
        var date = new Date()

        const users = []
        users.push(usernameReceiver)
        users.push(usernameSender)
        users.sort()

        const key = JSON.stringify(Object.assign({}, { user1: users[0] }, { user2: users[1] }, { collection: "messages" }));
        mess.push({
            "sender": usernameSender,
            "message": message,
            "date": date
        })
        client.set(key, JSON.stringify(mess))
        res.json({ "status": "OK" })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}


io.on('connection', function (socket) {
    console.log("welcome")
    socket.on('message', function (data) {
        io.emit('send', data)
    });
    socket.on('update_active_users', function (data) {
        io.emit('active_users', data)
    })
})