const Post = require('../models/post');
const Comment = require('../models/comment');
const Person = require('../models/person');
const uuid = require('node-uuid');
let { creds } = require("./../config/credentials");
let neo4j = require('neo4j-driver');
const _ = require('lodash');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(creds.neo4jusername, creds.neo4jpw));
const util = require('util')
const redis = require('redis');
const { concat } = require('lodash');
const post = require('../models/post');
const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.get = util.promisify(client.get);

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
const clientBlob = blobServiceClient.getContainerClient(containerName)

function _manyPosts(neo4jResult) {
    return neo4jResult.records.map(r => new Post(r.get('post')))
}
function _manyComments(neo4jResult) {
    return neo4jResult.records.map(r => new Comment(r.get('comments')))
}

function _manyPeople(neo4jResult) {
    return neo4jResult.records.map(r => new Person(r.get('person')))
}

async function findProps(node) {
    try {
        let session = driver.session();

        const query = [
            'MATCH (post:Post {id: $id})<-[r1:like]-(n:Person) with count(r1) as count \
             MATCH (post:Post {id: $id}) RETURN post, count \
             union all \
             MATCH (post:Post {id: $id})<-[r2:dislike]-(n:Person) with count(r2) as count \
             MATCH (post:Post {id: $id}) RETURN post, count \
             union all \
             MATCH (post:Post {id: $id})<-[r3:commented]-(n:Person) with count(r3) as count \
             MATCH (post:Post {id: $id}) RETURN post, count'

        ].join('\n')

        return session.readTransaction(txc =>
            txc.run(query, {
                id: node.id
            }))
            .then(result => {
                const Data1 = _manyPosts(result)
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

function findComments(node) {
    try {
        let session = driver.session();

        const query = [
            'MATCH (post:Post {id: $id})<-[r1:commented]-(n:Person) return r1 as comments'
        ].join('\n')

        return session.readTransaction(txc =>
            txc.run(query, {
                id: node.id
            }))
            .then(result => {
                const listOfComments = _manyComments(result)

                session.close();

                return listOfComments
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
            'MATCH (post:Post {id: $id})<-[r1:created]-(person:Person) return person'
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
async function findIfLiked(node, userId) {
    try {
        let session = driver.session();

        const query = [
            'MATCH (post:Post {id: $id})<-[r1:like]-(person:Person {id:$userId}) return r1'
        ].join('\n')

        return session.readTransaction(txc =>
            txc.run(query, {
                id: node.id,
                userId: userId
            }))
            .then(result => {
                session.close();
                if (result.records[0])
                    return "true"
                else
                    return "false"
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
            'MATCH (post:Post {id: $id})<-[r1:dislike]-(person:Person {id:$userId}) return r1'
        ].join('\n')

        return session.readTransaction(txc =>
            txc.run(query, {
                id: node.id,
                userId: userId
            }))
            .then(result => {
                session.close();
                if (result.records[0])
                    return "true"
                else
                    return "false"
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
    const blobClient = clientBlob.getBlobClient(blobName);
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
exports.getAll = async (req, res) => {
    try {
        let session = driver.session();

        const posts = await session.run('MATCH (post:Post) RETURN post', {
        });
        const p = _manyPosts(posts)
        session.close();

        let Data = []
        let creators = []
        Data = await Promise.all(p.map(post => {
            return findProps(post)
        }))

        creators = await Promise.all(
            p.map(post => {
                return post.creator = findCreator(post)
            }))
        Data.map((post, index) =>
            post.creator = creators[index])

        res.status(200)
            .json({ message: "Prikupljeno", Data })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.getByFollowings = async (req, res) => {
    try {
        let session = driver.session();

        const posts1 = await session.run('match (a:Person {id: $id})-[r:follows]->(b:Person)-[r1:created]->(post:Post) return post', {
            id: req.params.userId
        })
        const posts = _manyPosts(posts1)

        let creators = []
        let Data = []
        let ifLiked = []
        let ifDisliked = []


        Data = await Promise.all(posts.map(p => {
            return findProps(p)
        }))
        ifLiked = await Promise.all(
            Data.map(post => {
                return post.ifLiked = findIfLiked(post, req.params.userId)
            }))
        ifDisliked = await Promise.all(
            Data.map(post => {
                return post.ifDisliked = findIfDisliked(post, req.params.userId)
            }))
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

exports.getMostLiked = async (req, res) => {
    try {
        const key = JSON.stringify(Object.assign({}, { user: req.params.userId }, { collection: "postL" }));
        const cacheValue = await client.get(key)

        if (cacheValue) {
            const Data2 = JSON.parse(cacheValue)
            return res.status(200).json({ message: "Prikupljeno iz redisa", Data2 })
        }

        let session = driver.session();
        const posts1 = await session.run('match (a:Person {id: $id})-[r:follows]->(b:Person)-[r1:created]->(post:Post) return post', {
            id: req.params.userId
        })
        const posts = _manyPosts(posts1)
        session.close();

        let creators = []
        let Data = []
        Data = await Promise.all(posts.map(p => {
            return findProps(p)
        }))
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

        client.set(key, JSON.stringify(Data1));
        client.expire(key, 10);
        res.status(200)
            .json({ message: "Prikupljeno", Data1 })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.getMostHated = async (req, res) => {
    try {
        const key = JSON.stringify(Object.assign({}, { user: req.params.userId }, { collection: "postL" }));
        const cacheValue = await client.get(key)

        if (cacheValue) {
            const Data2 = JSON.parse(cacheValue)
            return res.status(200).json({ message: "Prikupljeno iz redisa", Data2 })
        }

        let session = driver.session();
        const posts1 = await session.run('match (a:Person {id: $id})-[r:follows]->(b:Person)-[r1:created]->(post:Post) return post', {
            id: req.params.userId
        })
        const posts = _manyPosts(posts1)
        session.close();

        let creators = []
        let Data = []
        Data = await Promise.all(posts.map(p => {
            return findProps(p)
        }))
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

        client.set(key, JSON.stringify(Data1));
        client.expire(key, 10);
        res.status(200)
            .json({ message: "Prikupljeno", Data1 })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.getMostCommented = async (req, res) => {
    try {
        const key = JSON.stringify(Object.assign({}, { user: req.params.userId }, { collection: "postL" }));
        const cacheValue = await client.get(key)

        if (cacheValue) {
            const Data2 = JSON.parse(cacheValue)
            return res.status(200).json({ message: "Prikupljeno iz redisa", Data2 })
        }

        let session = driver.session();
        const posts1 = await session.run('match (a:Person {id: $id})-[r:follows]->(b:Person)-[r1:created]->(post:Post) return post', {
            id: req.params.userId
        })
        const posts = _manyPosts(posts1)
        session.close();

        let creators = []
        let Data = []
        Data = await Promise.all(posts.map(p => {
            return findProps(p)
        }))
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

        client.set(key, JSON.stringify(Data1));
        client.expire(key, 10);
        res.status(200)
            .json({ message: "Prikupljeno", Data1 })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.getByPostId = async (req, res) => {
    try {
        let session = driver.session();

        const post1 = await session.run('MATCH (post:Post {id: $id}) RETURN post', {
            id: req.params.id
        })
        const post2 = _manyPosts(post1)[0]
        let post = await findProps(post2)

        post.commentsList = await findComments(post)
        post.creator = await findCreator(post)
        post.creator.profilePic = await generateSAS(post.creator.profilePic)
        Data = post

        Data.ifLiked = await findIfDisliked(post, req.params.userId)
        Data.ifDisliked = await findIfDisliked(post, req.params.userId)
        session.close();
        res.status(200)
            .json({ message: "Prikupljeno", Data })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.getByPerson = async (req, res) => {
    try {
        let session = driver.session();
        const key = JSON.stringify(Object.assign({}, { user: req.params.id }, { collection: "post" }));

        const cacheValue = await client.get(key)

        if (cacheValue) {
            const Data = JSON.parse(cacheValue)

            return res.status(200).json({ message: "Prikupljeno iz redisa", Data })
        }

        const posts = await session.run('MATCH (n:Person {id: $id})-[r:created]->(post:Post) RETURN post', {
            id: req.params.id
        })
        session.close();
        const Data = _manyPosts(posts)

        client.set(key, JSON.stringify(Data));
        client.expire(key, 10);

        res.status(200)
            .json({ message: "Prikupljeno iz neo4j", Data })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.createPost = async (req, res) => {
    try {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        today = dd + '.' + mm + '.' + yyyy;

        let session = driver.session();
        const query = [
            'match (a:Person {id:$personId}) \
            merge (a)-[r:created]->(post:Post {id: $id, date: $date, content: $content})'
        ].join('\n')

        const d = await session.writeTransaction(txc =>
            txc.run(query, {
                id: uuid.v4(),
                date: today,
                content: req.body.content,
                personId: req.body.personId
            }))

        const Data1 = _manyPosts(d)
        const Data = Data1[0]
        session.close();
        res.status(200)
            .json({ message: "Kreiran post", Data })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.like = async (req, res) => {
    try {
        let session = driver.session();
        const rel = await session.run('match (a:Person {id:$personId}),(post:Post {id:$postId}) merge (a)-[r:like]->(post) return r ', {
            personId: req.body.personId,
            postId: req.body.postId
        })
        let post = await session.run('match (post:Post {id:$postId}) return post ', {
            personId: req.body.personId,
            postId: req.body.postId
        })
        session.close();
        post = _manyPosts(post)[0]
        const creator = await findCreator(post)

        //const channel = "post" + creator.id

        //const Data = {liker: req.body.personId, post: req.body.postId, creator: creator.id } 
        // client.publish("likes", Data.toString())
        // console.log(Data)

        res.status(200)
            .json({ message: "Like postavljen", rel })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};
exports.removeLike = async (req, res) => {
    try {
        let session = driver.session();
        let like = await session.run('match (a:Person {id:$personId})-[r:like]->(post:Post {id:$postId}) return r ', {
            personId: req.body.personId,
            postId: req.body.postId
        })
        if (like) {
            await session.run('match (a:Person {id:$personId})-[r:like]->(post:Post {id:$postId}) delete r', {
                personId: req.body.personId,
                postId: req.body.postId
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
        let session = driver.session();
        const rel = await session.run('match (a:Person {id:$personId}),(post:Post {id:$postId}) merge (a)-[r:dislike]->(post) return r ', {
            personId: req.body.personId,
            postId: req.body.postId
        })
        session.close();
        res.status(200)
            .json({ message: "Disike postavljen", rel })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};
exports.removeDislike = async (req, res) => {
    try {
        let session = driver.session();
        let dislike = await session.run('match (a:Person {id:$personId})-[r:dislike]->(post:Post {id:$postId}) return r ', {
            personId: req.body.personId,
            postId: req.body.postId
        })
        if (dislike) {
            await session.run('match (a:Person {id:$personId})-[r:dislike]->(post:Post {id:$postId}) delete r', {
                personId: req.body.personId,
                postId: req.body.postId
            })
        }
        session.close();

        res.status(200)
            .json({ message: "Dislike obrisan" })
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
};

exports.deletePost = async (req, res) => {
    let session = driver.session();
    try {
        const rel = await session.run('match (a:Person)-[r]->(post:Post {id:$postId}) delete r ', {
            postId: req.body.postId
        })
        post = await session.run('MATCH (post:Post {id: $postId}) DELETE post', {
            postId: req.body.postId
        });
        res.status(200)
            .json({ message: "Obrisan" });
    }
    catch (err) {
        res.json({ success: false });
        console.log(err);
    }
}
