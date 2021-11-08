const Comment = require('../models/comment');
const Person = require('../models/person');
const uuid = require('node-uuid');
let { creds } = require("./../config/credentials");
let neo4j = require('neo4j-driver');
const _ = require('lodash');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(creds.neo4jusername, creds.neo4jpw));
const util = require('util')
// const redis = require('redis');
// const redisUrl = 'redis://127.0.0.1:6379';
// const client = redis.createClient(redisUrl);
// client.get = util.promisify(client.get);
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

function _manyComments(neo4jResult) {
    return neo4jResult.records.map(r => new Comment(r.get('comment')))
}
function _manyPeople(neo4jResult) {
    return neo4jResult.records.map(r => new Person(r.get('person')))
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
async function findCreator(postId, commId) {
    try {
        let session = driver.session();
        const query = [
            'MATCH (post:Post {id: $id})<-[r1:commented {commId:$commId}]-(person:Person) return person'
        ].join('\n')

        return session.readTransaction(txc =>
            txc.run(query, {
                id: postId,
                commId: commId
            }))
            .then(result => {
                const user = _manyPeople(result)
                session.close();
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
async function findCreatorForImageComm(postId, commId) {
    try {
        let session = driver.session();

        const query = [
            'MATCH (image:Image {id: $id})<-[r1:commented {commId:$commId}]-(person:Person) return person'
        ].join('\n')

        return session.readTransaction(txc =>
            txc.run(query, {
                id: postId,
                commId: commId
            }))
            .then(result => {
                const user = _manyPeople(result)
                session.close();
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

exports.getByPost = async (req, res) => {
    try {
        let session = driver.session();

        const comments = await session.run('MATCH (post:Post {id: $id})<-[r1:commented]-(n:Person) return r1 as comment', {
            id: req.params.postId
        });
        const comms = _manyComments(comments)
        session.close();

        let creators = []
        creators = await Promise.all(
            comms.map(post => {
                return post.creator = findCreator(req.params.postId, post.commId)
            }))
        let pics = await Promise.all(creators.map(p => {
            return p.sasUrl = generateSAS(p.profilePic)
        }))
        creators.map((c, index) =>
            c.profilePic = pics[index])
        comms.map((post, index) =>
            post.creator = creators[index])
        const p = comms
        res.status(200)
            .json({ message: "Prikupljeno", p })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}
exports.getByImage = async (req, res) => {
    try {
        let session = driver.session();

        const comments = await session.run('MATCH (image:Image {id: $id})<-[r1:commented]-(n:Person) return r1 as comment ORDER BY r1.date', {
            id: req.params.imageId
        });
        const comms = _manyComments(comments)
        session.close();

        let creators = []
        creators = await Promise.all(
            comms.map(post => {
                return post.creator = findCreatorForImageComm(req.params.imageId, post.commId)
            }))
        let pics = await Promise.all(creators.map(p => {
            return p.sasUrl = generateSAS(p.profilePic)
        }))
        creators.map((c, index) =>
            c.profilePic = pics[index])
        comms.map((post, index) =>
            post.creator = creators[index])
        const p = comms
        res.status(200)
            .json({ message: "Prikupljeno", p })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err)
    }
}
exports.addToPost = async (req, res) => {
    try {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); 
        var yyyy = today.getFullYear();
        today = dd + '.' + mm + '.' + yyyy;

        let session = driver.session();
        const query = [
            'match (p:Post), (a:Person) \
             where p.id = $postId and a.id = $personId\
             create (p)<-[comment:commented {commId:$commId, date:$date, content:$content}]-(a) \
             RETURN comment'
        ].join('\n')

        const com = await session.writeTransaction(txc =>
            txc.run(query, {
                commId: uuid.v4(),
                date: today,
                content: req.body.content,
                personId: req.body.personId,
                postId: req.body.postId
            }))

        const comment = _manyComments(com)
        const Data = comment[0]
        Data.postId = req.body.postId
        Data.creator = req.body.personId

        session.close();
        res.status(200)
            .json({ message: "Kreiran komentar", Data })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};
exports.addToImage = async (req, res) => {
    try {
        var now = new Date();
        // var dd = String(today.getDate()).padStart(2, '0');
        // var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        // var yyyy = today.getFullYear();
        // today = dd + '.' + mm + '.' + yyyy;

        let session = driver.session();
        const query = [
            'match (p:Image), (a:Person) \
             where p.id = $imageId and a.id = $personId\
             create (p)<-[comment:commented {commId:$commId, date:$date, content:$content}]-(a) \
             RETURN comment'
        ].join('\n')

        const com = await session.writeTransaction(txc =>
            txc.run(query, {
                commId: uuid.v4(),
                date: now.toUTCString(),
                content: req.body.content,
                personId: req.body.personId,
                imageId: req.body.imageId
            }))

        const comment = _manyComments(com)
        const Data = comment[0]
        Data.postId = req.body.imageId
        Data.creator = req.body.personId

        session.close();
        res.status(200)
            .json({ message: "Kreiran komentar", Data })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};
exports.deleteFromImage = async (req, res) => {
    let session = driver.session();
    try {
        comm = await session.run("MATCH (p:Person)-[r:commented {commId:$id}]->(image:Image) DETACH DELETE r", {
            id: req.params.id,
        });
        res.status(200).json({ message: "Obrisan" });
    } catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};
exports.deleteFromPost = async (req, res) => {
    let session = driver.session();
    try {
        comm = await session.run("MATCH (p:Person)-[r:commented {commId:$id}]->(post:Post) DETACH DELETE r", {
            id: req.params.id,
        });
        res.status(200).json({ message: "Obrisan" });
    } catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};
