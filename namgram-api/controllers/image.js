const Image = require('../models/image');
const Person = require('../models/person');
let { creds } = require("./../config/credentials");
let neo4j = require('neo4j-driver');
const _ = require('lodash');
const jwtDecode = require('jwt-decode');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(creds.neo4jusername, creds.neo4jpw));
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

const util = require('util')
const redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
const clientR = redis.createClient(redisUrl);
clientR.get = util.promisify(clientR.get);

const express = require('express');
const app = express();
var server = require('http').createServer(app)
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

function findProps(node) {
    try {
        let session = driver.session();

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

        return session.readTransaction(txc =>
            txc.run(query, {
                id: node.id
            }))
            .then(result => {
                const Data1 = _manyImages(result)
                Data1[0].likes = result.records[0].get('count').low
                Data1[0].dislikes = result.records[1].get('count').low
                Data1[0].comments = result.records[2].get('count').low
                const Data = Data1[0]
                session.close();

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
        let session = driver.session();

        const query = [
            'MATCH (image:Image {id: $id})<-[r1:created]-(person:Person) return person'
        ].join('\n')

        return session.readTransaction(txc =>
            txc.run(query, {
                id: node.id
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
        let session = driver.session();

        const query = [
            'MATCH (image:Image {id: $id})<-[r1:like]-(person:Person {id:$userId}) return r1'
        ].join('\n')

        return session.readTransaction(txc =>
            txc.run(query, {
                id: node.id,
                userId: userId
            }))
            .then(result => {
                session.close();
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
        let session = driver.session();

        const query = [
            'MATCH (image:Image {id: $id})<-[r1:dislike]-(person:Person {id:$userId}) return r1'
        ].join('\n')

        return session.readTransaction(txc =>
            txc.run(query, {
                id: node.id,
                userId: userId
            }))
            .then(result => {
                session.close();
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
function _manyImages(neo4jResult) {
    return neo4jResult.records.map(r => new Image(r.get('image')))
}
function _manyPeople(neo4jResult) {
    return neo4jResult.records.map(r => new Person(r.get('person')))
}

exports.get = async (req, res) => {
    try {
        let session = driver.session();

        const im = await session.run('MATCH (image:Image {id: $id}) RETURN image', {
            id: req.params.id
        });
        const p = _manyImages(im)
        Data1 = await Promise.all(p.map(p => {
            return findProps(p)
        }))
        Data1.map(image => {
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
        session.close();

        let creators = []
        creators = await Promise.all(
            Data1.map(post => {
                return post.creator = findCreator(post)
            }))
        let pics = await Promise.all(creators.map(p => {
            return p.sasUrl = generateSAS(p.profilePic)
        }))
        creators.map((c, index) =>
            c.profilePic = pics[index])
        if(req.headers.authorization){
            const personId = jwtDecode(req.headers.authorization).id
            Data1[0].ifLiked = await findIfLiked(Data1[0], personId)
            Data1[0].ifDisliked = await findIfDisliked(Data1[0], personId)
        }
        
        Data1.map((post, index) => {
            post.creator = creators[index]})
        
        res.status(200)
            .json({ message: "Prikupljeno", Data1 })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
}

exports.getAll = async (req, res) => {
    try {
        let session = driver.session();

        const im = await session.run('MATCH (image:Image) RETURN image', {
        });
        const p = _manyImages(im)

        Data1 = await Promise.all(p.map(p => {
            return findProps(p)
        }))
        Data1.map(image => {
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
        session.close();

        let creators = []
        creators = await Promise.all(
            Data1.map(post => {
                return post.creator = findCreator(post)
            }))
        Data1.map((post, index) =>
            post.creator = creators[index])

        res.status(200)
            .json({ message: "Prikupljeno", Data1 })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
}

exports.getByPerson = async (req, res) => {
    try {
        let session = driver.session();

        const images = await session.run('MATCH (n:Person {id: $id})-[r:created]->(image:Image) RETURN image', {
            id: req.params.id
        })
        session.close();
        const Data = _manyImages(images)

        Data1 = await Promise.all(Data.map(p => {
            return findProps(p)
        }))
        Data1.map(image => {
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

        let creators = []
        creators = await Promise.all(
            Data1.map(post => {
                return post.creator = findCreator(post)
            }))
        let pics = await Promise.all(creators.map(p => {
            return p.sasUrl = generateSAS(p.profilePic)
        }))
        creators.map((c, index) =>
            c.profilePic = pics[index])
        Data1.map((post, index) =>
            post.creator = creators[index])

        res.status(200)
            .json({ message: "Prikupljeno iz neo4j", Data1 })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.getByFollowings = async (req, res) => {
    try {
        let session = driver.session();

        const images1 = await session.run('match (a:Person {id: $id})-[r:follows]->(b:Person)-[r1:created]->(image:Image) return image', {
            id: req.params.userId
        })
        const images = _manyImages(images1)
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
                return post.ifLiked = findIfLiked(post, req.params.userId)
            }))
        ifDisliked = await Promise.all(
            Data.map(post => {
                return post.ifDisliked = findIfDisliked(post, req.params.userId)
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

        session.close();
        res.status(200)
            .json({ message: "Prikupljeno", Data })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.getMostLikedF = async (req, res) => {
    try {
        let Data = []
        const key = JSON.stringify(Object.assign({}, {user: req.params.username}, { collection: "images" }));
        const cacheValue = await clientR.get(key)
        
        if (cacheValue) {
            Data = JSON.parse(cacheValue)
        }
        let session = driver.session();
        Data = await Promise.all(Data.map(p => {
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
        session.close();

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
        Data.map((post, index) =>
            post.creator = creators[index])

        Data.sort(function (a, b) {
            return b.likes - a.likes
        })
        let Data1 = []
        let size = 5
        Data1 = Data.slice(0, size)

        res.status(200)
            .json({ message: "Prikupljeno", Data1 })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.getMostHatedF = async (req, res) => {
    try {
        let Data = []
        const key = JSON.stringify(Object.assign({}, {user: req.params.username}, { collection: "images" }));
        const cacheValue = await clientR.get(key)
        
        if (cacheValue) {
            Data = JSON.parse(cacheValue)
        }
        let session = driver.session();
        Data = await Promise.all(Data.map(p => {
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
        session.close();

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
        Data.map((post, index) =>
            post.creator = creators[index])

        Data.sort(function (a, b) {
            return b.dislikes - a.dislikes
        })
        let Data1 = []
        let size = 5
        Data1 = Data.slice(0, size)

        res.status(200)
            .json({ message: "Prikupljeno", Data1 })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.getMostCommentedF = async (req, res) => {
    try {
        let Data = []
        const key = JSON.stringify(Object.assign({}, {user: req.params.username}, { collection: "images" }));
        const cacheValue = await clientR.get(key)
        
        if (cacheValue) {
            Data = JSON.parse(cacheValue)
        }
        let session = driver.session();
        Data = await Promise.all(Data.map(p => {
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
        session.close();

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
        Data.map((post, index) =>
            post.creator = creators[index])

        Data.sort(function (a, b) {
            return b.comments - a.comments
        })
        let Data1 = []
        let size = 5
        Data1 = Data.slice(0, size)

        res.status(200)
            .json({ message: "Prikupljeno", Data1 })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.like = async (req, res) => {
    try {
        let session = driver.session();
        const rel = await session.run('match (a:Person {id:$personId}),(image:Image {id:$imageId}) merge (a)-[r:like {score:$score}]->(image) return r ', {
            personId: req.body.personId,
            imageId: req.body.imageId,
            score: req.body.score
        })
        let image = await session.run('MATCH (image:Image {id: $imageId}) RETURN image', {
            imageId: req.body.imageId
        })
        image = _manyImages(image)[0]
        session.close();
        res.status(200)
            .json({ message: "Like" })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};
exports.removeLike = async (req, res) => {
    try {
        let session = driver.session();
        let like = await session.run('match (a:Person {id:$personId})-[r:like]->(image:Image {id:$imageId}) return r ', {
            personId: req.body.personId,
            imageId: req.body.imageId
        })
        if (like) {
            await session.run('match (a:Person {id:$personId})-[r:like]->(image:Image {id:$imageId}) delete r', {
                personId: req.body.personId,
                imageId: req.body.imageId
            })
        }
        session.close();

        res.status(200)
            .json({ message: "Like obrisan" })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.dislike = async (req, res) => {
    try {
        console.log(req.body)
        let session = driver.session();
        const rel = await session.run('match (a:Person {id:$personId}),(image:Image {id:$imageId}) merge (a)-[r:dislike {score:$score}]->(image) return r ', {
            personId: req.body.personId,
            imageId: req.body.imageId,
            score: req.body.score
        })
        session.close();
        res.status(200)
            .json({ message: "Disike", rel })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};
exports.removeDislike = async (req, res) => {
    try {
        let session = driver.session();
        let dislike = await session.run('match (a:Person {id:$personId})-[r:dislike]->(image:Image {id:$imageId}) return r ', {
            personId: req.body.personId,
            imageId: req.body.imageId
        })
        if (dislike) {
            await session.run('match (a:Person {id:$personId})-[r:dislike]->(image:Image {id:$imageId}) delete r', {
                personId: req.body.personId,
                imageId: req.body.imageId
            })
        }
        session.close();

        res.status(200)
            .json({ message: "dislike obrisan" })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};
exports.deleteImage = async (req, res) => {
    let session = driver.session();
    try {
        const rel = await session.run('match (a:Person)-[r]->(image:Image {id:$imageId}) delete r ', {
            imageId: req.params.imageId
        })
        p = await session.run('MATCH (image:Image {id: $imageId}) DELETE image', {
            imageId: req.params.imageId
        });
        res.status(200)
            .json({ message: "Obrisan" });
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
}




