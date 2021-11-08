const Image = require('../models/image');
const Person = require('../models/person');
const uuid = require('node-uuid');
let { creds } = require("./../config/credentials");
let neo4j = require('neo4j-driver');
const _ = require('lodash');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(creds.neo4jusername, creds.neo4jpw));

const express = require('express');
const imageController = require('../controllers/image');
const router = express.Router();

const {
    BlobServiceClient,
    StorageSharedKeyCredential,
    newPipeline
} = require('@azure/storage-blob');
const multer = require('multer');
const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage }).single('image');
const getStream = require('into-stream');
const containerName2 = 'namgram1609522522970';
const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };
const sharedKeyCredential = new StorageSharedKeyCredential(
    process.env.AZURE_STORAGE_ACCOUNT_NAME,
    process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY);
const pipeline = newPipeline(sharedKeyCredential);
const blobServiceClient = new BlobServiceClient(
    `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    pipeline
);

const util = require('util')
const redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
const clientR = redis.createClient(redisUrl);
clientR.get = util.promisify(clientR.get);

const getBlobName = originalName => {
    const identifier = Math.random().toString().replace(/0\./, '');
    return `${identifier}-${originalName}`;
};

function _manyImages(neo4jResult) {
    return neo4jResult.records.map(r => new Image(r.get('image')))
}
function _manyPerson(neo4jResult) {
    return neo4jResult.records.map(r => new Person(r.get('person')))
}

router.get('/:id', imageController.get);
router.get('/getAll', imageController.getAll)
router.get('/byId/:id', imageController.getByPerson);
router.get('/byFollowings/:userId', imageController.getByFollowings);
router.get('/mostLikedF/:username', imageController.getMostLikedF);
router.get('/mostHatedF/:username', imageController.getMostHatedF);
router.get('/mostCommentedF/:username', imageController.getMostCommentedF);
router.post('/like', imageController.like);
router.post('/removeLike', imageController.removeLike);
router.post('/dislike', imageController.dislike);
router.post('/removedisLike', imageController.removeDislike);
router.delete('/deleteImage/:imageId', imageController.deleteImage);

async function asyncForEach(followers, callback){

        }

router.post('/add', uploadStrategy, async (req, res) => {
    try {
        const now = new Date();

        const content = req.body.caption
        const personId = req.body.personId

        const blobName = await getBlobName(req.file.fieldname);
        const stream = await getStream(req.file.buffer);
        const containerClient = await blobServiceClient.getContainerClient(containerName2);
        const blockBlobClient = await containerClient.getBlockBlobClient(blobName);

        let session = driver.session();
        const query = [
            'match (a:Person {id:$personId}) \
            merge (a)-[r:created]->(b:Image {id:$id, date:$date, content:$content, blobName:$blobName}) \
            '
        ].join('\n')

        const d = await session.writeTransaction(txc =>
            txc.run(query, {
                id: uuid.v4(),
                date: now.toUTCString(),
                content: content,
                personId: personId,
                blobName: blobName
            }))

        await blockBlobClient.uploadStream(stream,
            uploadOptions.bufferSize, uploadOptions.maxBuffers,
            { blobHTTPHeaders: { blobContentType: "image/jpeg" } });

        let Data = await session.run('MATCH (image:Image {blobName: $blobName}) RETURN image', {
            blobName: blobName
        })

        const persons = await session.run('MATCH (n:Person {id: $personId})<--(person) RETURN person', {
            personId: personId
        })
        const followers = _manyPerson(persons)
        session.close();
        let image = _manyImages(Data)[0]

        followers.forEach(async follower => {
            const key = JSON.stringify(Object.assign({}, { user: follower.username }, { collection: "images" } ));
            const cacheValue = await clientR.get(key)
            if (cacheValue) {
                Data = JSON.parse(cacheValue)
            }
            else
              { 
                Data = []}
            Data.push(image)
            clientR.set(key, JSON.stringify(Data));
            clientR.expire(key, 864000);//jedan dan 
        })
        res.json({ message: 'File uploaded to Azure Blob storage.', Data });
    } catch (err) {
        res.json({ message: err.message });
    }
});
router.post('/addProfilePic', uploadStrategy, async (req, res) => {
    try {
        const personId = req.body.personId

        const blobName = await getBlobName(req.file.fieldname);
        const stream = await getStream(req.file.buffer);
        const containerClient = await blobServiceClient.getContainerClient(containerName2);
        const blockBlobClient = await containerClient.getBlockBlobClient(blobName);

        let session = driver.session();
        const image = await session.run(
            "MATCH (image:Image {person:$id}) delete image",
            {
              id: req.body.personId,
            }
          );
        let person = await session.run('MATCH (person:Person {id: $id}) set person.profilePic = $blobName RETURN person', {
            id: personId,
            blobName: blobName
        });
        person = _manyPerson(person)
        const query = [

            'create (b:Image {id:$id, person:$personId, blobName:$blobName})'
        ].join('\n')

        const d = await session.writeTransaction(txc =>
            txc.run(query, {
                id: uuid.v4(),
                personId: personId,
                blobName: blobName
            }))
        const Data1 = _manyImages(d)
        const Data = Data1[0]
        await blockBlobClient.uploadStream(stream,
            uploadOptions.bufferSize, uploadOptions.maxBuffers,
            { blobHTTPHeaders: { blobContentType: "image/jpeg" } });

        session.close();
        res.json({ message: 'File uploaded to Azure Blob storage.', Data });
    } catch (err) {
        res.json({ message: err.message });
    }
});


module.exports = router;