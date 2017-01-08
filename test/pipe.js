'use strict';

const util = require('util');
const fs = require('fs');
const Mailparser2 = require('../lib/mailparser2.js');

let parser = new Mailparser2();

console.log(parser.normalizeCharset('utf8'));
console.log(parser.normalizeCharset('Latin_1'));
console.log(parser.normalizeCharset('l9'));
console.log(parser.normalizeCharset('sssss'));


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
