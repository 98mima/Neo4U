const _ = require('lodash');

const Tag = module.exports = function (_node) {
    _.extend(this, {
        "name": _node.properties['name'],
    })
  
};
 