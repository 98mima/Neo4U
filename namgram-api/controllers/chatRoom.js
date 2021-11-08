const redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
const clientR = redis.createClient(redisUrl);
var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)

let { creds } = require("./../config/credentials");
let neo4j = require('neo4j-driver');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(creds.neo4jusername, creds.neo4jpw));
const uuid = require('node-uuid');
const _ = require('lodash');
const Person = require("../models/person");
const Room = require("../models/room");
const Image = require("../models/image");
const e = require('express');

var storage = require("@azure/storage-blob")
const accountname = "namgram";
const key = "b9/PjmImjnORF1berLyRe3OYyAO0dDGcTbqIYm5AkCm8tqYukKm/umiUPWLJujc2n+zPFwKbKKNFZAZm8kqWhA==";
const cerds = new storage.StorageSharedKeyCredential(accountname, key);
const {
    BlobServiceClient,
    StorageSharedKeyCredential,
    newPipeline
} = require('@azure/storage-blob');
const sharedKeyCredential = new StorageSharedKeyCredential(
    process.env.AZURE_STORAGE_ACCOUNT_NAME,
    process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY);
const pipeline = newPipeline(sharedKeyCredential);
const blobServiceClient = new BlobServiceClient(
    `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    pipeline
);
const containerName = 'namgram1609522522970';
const client = blobServiceClient.getContainerClient(containerName)
const personController = require("../controllers/person");


let session = driver.session();

function findProps(node) {
    try {
        let session2 = driver.session();

        const query = [
            'MATCH (image:Image {id: $id})<-[r1:like]-(n:Person) with count(r1) as count \
             MATCH (image:Image {id: $id}) RETURN image, count \
             union all \
             MATCH (image:Image {id: $id})<-[r2:dislike]-(n:Person) with count(r2) as count \
             MATCH (image:Image {id: $id}) RETURN image, count \
             union all \
             MATCH (image:Image {id: $id})<-[r3:commented]-(n:Person) with count(r3) as count \
             MATCH (image:Image {id: $id}) RETURN image, count'

        ].join('\n')

        return session2.readTransaction(txc =>
            txc.run(query, {
                id: node.id
            }))
            .then(result => {
                const Data1 = _manyImages(result)
                Data1[0].likes = result.records[0].get('count').low
                Data1[0].dislikes = result.records[1].get('count').low
                Data1[0].comments = result.records[2].get('count').low
                const Data = Data1[0]
                // session2.close();

                return Data
            })
            .catch(err => {
                console.log(err)
            })
    }
    catch (err) {
        console.log(err)
    }
}

async function findCreator(node) {
    try {
        let session2 = driver.session();

        const query = [
            'MATCH (image:Image {id: $id})<-[r1:created]-(person:Person) return person'
        ].join('\n')

        return session2.readTransaction(txc =>
            txc.run(query, {
                id: node.id
            }))
            .then(result => {
                const user = _manyPeople(result)
                // session2.close();

                return user[0]
            })
            .catch(err => {
                console.log(err)
            })
    }
    catch (err) {
        console.log(err)
    }
}
async function generateSAS(blobName) {
    const blobClient = client.getBlobClient(blobName);
    const blobSAS = storage
        .generateBlobSASQueryParameters(
            {
                containerName,
                blobName: blobName,
                permissions: storage.BlobSASPermissions.parse("racwd"),
                startsOn: new Date(new Date().valueOf() - 86400),
                expiresOn: new Date(new Date().valueOf() + 86400),
            },
            cerds
        )
        .toString();

    const sasUrl = blobClient.url + "?" + blobSAS;
    return sasUrl;
}
async function findIfLiked(node, userId) {
    try {
        let session2 = driver.session();

        const query = [
            'MATCH (image:Image {id: $id})<-[r1:like]-(person:Person {id:$userId}) return r1'
        ].join('\n')

        return session2.readTransaction(txc =>
            txc.run(query, {
                id: node.id,
                userId: userId
            }))
            .then(result => {
                session2.close();
                if (result.records[0])
                    return true
                else
                    return false
            })
            .catch(err => {
                console.log(err)
            })
    }
    catch (err) {
        console.log(err)
    }
}
async function findIfDisliked(node, userId) {
    try {
        let session2 = driver.session();

        const query = [
            'MATCH (image:Image {id: $id})<-[r1:dislike]-(person:Person {id:$userId}) return r1'
        ].join('\n')

        return session2.readTransaction(txc =>
            txc.run(query, {
                id: node.id,
                userId: userId
            }))
            .then(result => {
                session2.close();
                if (result.records[0])
                    return true
                else
                    return false
            })
            .catch(err => {
                console.log(err)
            })
    }
    catch (err) {
        console.log(err)
    }
}

function _manyPeople(neo4jResult) {
    return neo4jResult.records.map((r) => new Person(r.get("person")));
}

function _manyRooms(neo4jResult) {
    return neo4jResult.records.map((r) => new Room(r.get("room")));
}

function _manyImages(neo4jResult) {
    return neo4jResult.records.map(r => new Image(r.get('image')))
}


async function getByName(name) {
    const person = await session.run(
        "MATCH (person:Person {name: $name}) RETURN person",
        {
            name: name,
        });
    const Data = _manyPeople(person)
    return Data

};

async function addProps(images, userId)
{
    let Data = []

    Data = await Promise.all(images.map(p => {
        return findProps(p)
    }))

    Data.map(image => {
        const blobName = image.blobName
        const blobClient = client.getBlobClient(blobName);
        const blobSAS = storage.generateBlobSASQueryParameters({
            containerName,
            blobName: blobName,
            permissions: storage.BlobSASPermissions.parse("racwd"),
            startsOn: new Date(new Date().valueOf() - 86400),
            expiresOn: new Date(new Date().valueOf() + 86400)
        },
            cerds
        ).toString();

        const sasUrl = blobClient.url + "?" + blobSAS;
        image.sasToken = sasUrl
    })

    let ifLiked = []
    let ifDisliked = []
    ifLiked = await Promise.all(
        Data.map(post => {
            return post.ifLiked = findIfLiked(post, userId)
        }))
    ifDisliked = await Promise.all(
        Data.map(post => {
            return post.ifDisliked = findIfDisliked(post, userId)
        }))
    let creators = []
    creators = await Promise.all(
        Data.map(post => {
            return post.creator = findCreator(post)
        }))

    let pics = await Promise.all(creators.map(p => {
        return p.sasUrl = generateSAS(p.profilePic)
    }))
    creators.map((c, index) =>
        c.profilePic = pics[index])
    Data.map((post, index) => {
        post.creator = creators[index]
        post.ifLiked = ifLiked[index]
        post.ifDisliked = ifDisliked[index]
    })
    return Data
}
exports.getRoom = async (req, res) => {
    try {
        const chatters = _manyPeople(await session.run(`match (person:Person)-[r:send]->(room:Room {name:$name}) return person`, {
            name: req.params.room,
        }))

        var room = req.params.room

        let messages = []
        const key = JSON.stringify(Object.assign({}, { room: room }, { collection: "messages" }));

        clientR.get(key, function (err, reply) {
            if (reply) {
                messages = JSON.parse(reply)
                return res.status(200).json({ messages, chatters, message: "Success" })
            }
            else {
                return res.status(200).json("No messages yet!")
            }
        })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}

exports.getJaccard = async (req, res) => {
    try {
        console.log('jaccard')

        const person = await getByName(req.params.name)

        const _similarUsers = await session.run(`MATCH (p1:Person {name:$name})-[:commented]->(image1)
        WITH p1, collect(id(image1)) AS p1image
        MATCH (p2:Person)-[:commented]->(image2)
        where not  (p1.username = p2.username)
        WITH p1, p1image, p2, collect(id(image2)) AS p2image
        RETURN p1.name AS from,
        p2.name AS to,
        gds.alpha.similarity.jaccard(p1image, p2image) AS similarity
        ORDER BY similarity DESC
        LIMIT 3
        `, { name: req.params.name })
        const similarUsers = _similarUsers.records.map(r => r._fields[1])
        let imgs = []
        
        console.log("najslicniji" + similarUsers[0])

        if (similarUsers.length === 0) {
            return res.status(200).json({ message: "No similar users", })
        }

        imgs = await session.run(`match (person:Person {name:$name})-[:like | dislike]->(image:Image) 
        match (person2:Person {name:$nameP})
        where not (person2)-[:created | commented ]->(image)
        return distinct image`, {
            nameP: req.params.name,
            name: similarUsers[0]
        })
        const images = _manyImages(imgs)
        if(images.length === 0 ){
            return res.status(200).json({ message: `No related images from similar user ${similarUsers[0]}` })
        }

        const Data = await addProps(images, person[0].id)

        return res.status(200).json({ message: "Success", Data })

    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}

exports.getEuclidean = async (req, res) => {
    try {
        console.log('euklid')
        const person = await getByName(req.params.name)

        const _similarUsers = await session.run(`
        MATCH (p1:Person {name:$name})-[likes1:dislike]->(image)
        MATCH (p2:Person)-[likes2:dislike]->(image) WHERE p2 <> p1
        RETURN p1.name AS from,
        p2.name AS to,
        gds.alpha.similarity.euclideanDistance(collect(likes1.score), collect(likes2.score)) AS similarity
        ORDER BY similarity DESC
        `, { name: req.params.name })
        const similarUsers = _similarUsers.records.map(r => r._fields[1])
  
        let imgs = []
        
        if (similarUsers.length === 0) {
            return res.status(200).json({ message: "No similar users", })
        }

        imgs = await session.run(`match (person:Person {name:$name})-[r:commented]->(image:Image) 
        match (person2:Person {name:$nameP})
        where not (person2)-[:created | commented]->(image)
        return distinct image`, {
            name: similarUsers[0],
            nameP: req.params.name
        })
        const images = _manyImages(imgs)
        if(images.length === 0 ){
            return res.status(200).json({ message: `No related images from similar user ${similarUsers[0]}` })
        }

        const Data = await addProps(images, person[0].id)

        return res.status(200).json({ message: "Success", Data })

    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}

exports.getPearson = async (req, res) => {
    try {
        console.log('pearson')
        const person = await getByName(req.params.name)

        // const _similarUsers = await session.run(`
        // MATCH (p:Person {name:$name}), (m:Image)
        // OPTIONAL MATCH (p)-[rated:Like]->(m)
        // WITH {item:id(p), weights: collect(coalesce(rated.score, gds.util.NaN()))} AS userData
        // WITH collect(userData) AS data
        // CALL gds.alpha.similarity.pearson.stream({
        //  data: data,
        //  similarityCutoff: 0.1,
        //  topK: 0
        // })
        // YIELD item1, item2, count1, count2, similarity
        // RETURN gds.util.asNode(item1).name AS from, gds.util.asNode(item2).name AS to, similarity
        // ORDER BY similarity DESC
        // `, { name: req.params.name })

        const _similarUsers = await session.run(`
        MATCH (p1:Person {name:$name})-[r:like]->(image:Image) 
        WITH p1, gds.alpha.similarity.asVector(image, r.score) AS p1Vector
        MATCH (p2:Person)-[r:like]->(image:Image) WHERE p2 <> p1
        WITH p1, p2, p1Vector, gds.alpha.similarity.asVector(image, r.score) AS p2Vector
        RETURN p1.name AS from,
        p2.name AS to,
        gds.alpha.similarity.pearson(p1Vector, p2Vector, {vectorType: "maps"}) AS similarity
        ORDER BY similarity DESC
        `, { name: req.params.name })
        const similarUsers = _similarUsers.records.map(r => r._fields[1])
       
       
        let imgs = []
        
        if (similarUsers.length === 0) {
            return res.status(200).json({ message: "No similar users", })
        }

        imgs = await session.run(`match (person:Person {name:$name})-[r:created]->(image:Image) 
        match (person2:Person {name:$nameP})
        where not (person2)-[: commented]->(image)
        return distinct image`, {
            name: similarUsers[0],
            nameP: req.params.name
        })
        const images = _manyImages(imgs)
        if(images.length === 0 ){
            return res.status(200).json({ message: `No related images from similar user ${similarUsers[0]}` })
        }

        const Data = await addProps(images, person[0].id)

        return res.status(200).json({ message: "Success", Data })

    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}

exports.getCosine = async (req, res) => {
    try {
        console.log('cosine')
        const person = await getByName(req.params.name)

        const _similarUsers = await session.run(`
        MATCH (p1:Person {name:$name})-[likes1:like | dislike]->(image)
        MATCH (p2:Person)-[likes2:like | dislike]->(image) WHERE p2 <> p1 and (p1)-[:follows]->(p2)
        RETURN p1.name AS from,
               p2.name AS to,
               gds.alpha.similarity.cosine(collect(likes1.score), collect(likes2.score)) AS similarity
        ORDER BY similarity DESC
        `, { name: req.params.name })
        const similarUsers = _similarUsers.records.map(r => r._fields[1])
      
        let imgs = []
        
        if (similarUsers.length === 0) {
            return res.status(200).json({ message: "No similar users", })
        }

        imgs = await session.run(`match (person:Person {name:$name})-[:commented]->(image:Image) 
        match (person2:Person {name:$nameP})
        where not (person2)-[:created | like | dislike | commented]->(image)
        return distinct image`, {
            name: similarUsers[0],
            nameP: req.params.name
        })
        const images = _manyImages(imgs)
        if(images.length === 0 ){
            return res.status(200).json({ message: `No related images from similar user ${similarUsers[0]}` })
        }

        const Data = await addProps(images, person[0].id)

        return res.status(200).json({ message: "Success", Data })

    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}

exports.getAdamicAdar = async (req, res) => {
    try {
        console.log('adamic')
        const person = await getByName(req.params.name)

        const _similarUsers = await session.run(`
        MATCH (p1:Person {name:$name})-[likes1:commented]->(image)
        MATCH (p2:Person)-[likes2:commented]->(image) 
        WHERE p2 <> p1 
        RETURN p1.name AS from,
        p2.name AS to,
        gds.alpha.linkprediction.adamicAdar(p1, p2) AS similarity
        ORDER BY similarity DESC
        `, { name: req.params.name })
        const similarUsers = _similarUsers.records.map(r => r._fields[1])
    
        let imgs = []
        
        if (similarUsers.length === 0) {
            return res.status(200).json({ message: "No similar users", })
        }
        console.log('najslicni: '+ similarUsers[0])

        imgs = await session.run(`match (person:Person {name:$name})-[:created | commented]->(image:Image)
        match (p:Person {name:$nameP})
        where not (p)-[:commented | created]->(image)
        return distinct image`, {
            name: similarUsers[0],
            nameP: req.params.name
        })
        const images = _manyImages(imgs)
        if(images.length === 0 ){
            return res.status(200).json({ message: `No related images from similar user ${similarUsers[0]}` })
        }

        const Data = await addProps(images, person[0].id)

        return res.status(200).json({ message: "Success", Data })

    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}

exports.addRoom = async (req, res) => {
    try {
        const room = await session.run('CREATE (room:Room {id: $id, name: $name}) RETURN room', {
            id: uuid.v4(),
            name: req.body.name,
        })

        const tags = req.body.tags.split(',')
        const strings = []
        tags.forEach(tag => {
            strings.push(tag)
        });

        strings.forEach(string => {
            let session2 = driver.session();

            const rel = session2.run(`match (room:Room {name:$name}) merge (room)-[r:has_tag]->(tag:Tag {name:$tag}) return r`, {
                tag: string,
                name: req.body.name
            })
        });
        return res.status(200).send({ message: "Success" })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}

exports.groupSendMessage = async (req, res) => {
    try {
        const rel = await session.run('match (person:Person {username:$username}),(room:Room {name:$name}) merge (person)-[r:send]->(room) return r ', {
            username: req.body.sender,
            name: req.body.room
        })

        var sender = req.body.sender
        var room = req.body.room
        var message = req.body.message
        var date = new Date()

        const key = JSON.stringify(Object.assign({}, { room: room }, { collection: "messages" }));

        clientR.get(key, function (err, reply) {
            if (reply) {
                mess = JSON.parse(reply)
                mess.push({
                    "sender": sender,
                    "message": message,
                    "date": date
                })
                clientR.set(key, JSON.stringify(mess))
                return res.status(200).send({ "status": "OK", message: "Success" })
            }
            else {
                const mess = []
                mess.push({
                    "sender": sender,
                    "message": message,
                    "date": date
                })
                clientR.set(key, JSON.stringify(mess))
                return res.status(200).send({ "status": "OK", message: "Success" })
            }

        })
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