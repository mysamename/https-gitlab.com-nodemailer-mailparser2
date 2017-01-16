/* eslint no-console:0 */

'use strict';

const util = require('util');
const fs = require('fs');
const simpleParser = require('../lib/simple-parser.js');

let input = fs.createReadStream(__dirname + '/simple.eml');

simpleParser(input, (err, mail) => {
    console.log(err || util.inspect(mail, false, 22));
});
