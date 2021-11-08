const _ = require('lodash');
let { creds } = require("./../config/credentials");
let neo4j = require('neo4j-driver');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(creds.neo4jusername, creds.neo4jpw));

const Image = module.exports = function (_node) {
    _.extend(this, {
        "id":  _node.properties['id'],
        "date": _node.properties['date'],
        "name": _node.properties['name'],
        "blobName": _node.properties['blobName'],
        "content": _node.properties['content']
    })
};