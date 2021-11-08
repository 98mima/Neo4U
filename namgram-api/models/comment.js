const _ = require('lodash');
let { creds } = require("./../config/credentials");
let neo4j = require('neo4j-driver');
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(creds.neo4jusername, creds.neo4jpw));

const Post = module.exports = function (_node) {
    _.extend(this, {
        'commId': _node.properties['commId'],
        'date': _node.properties['date'],
        'content': _node.properties['content'],
        'creator': _node.properties['creator'],
        'postId': _node.properties['postId']
    })
  
};