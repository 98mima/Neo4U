const _ = require('lodash');

const Room = module.exports = function (_node) {
    _.extend(this, {
        "id":  _node.properties['id'],
        "name": _node.properties['name'],
    })
  
};
 