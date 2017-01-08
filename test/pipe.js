'use strict';

const util = require('util');
const fs = require('fs');
const Mailparser2 = require('../lib/mailparser2.js');

let parser = new Mailparser2();
let input = fs.createReadStream(__dirname + '/eee.eml');

input.pipe(parser);

parser.on('headers', headers => {
    console.log('HEADERS');
    console.log(util.inspect(headers, false, 22));
});

parser.on('data', data => {
    console.log('DATA');
});

parser.on('end', () => {
    console.log('END');
});
