/* eslint no-console:0 */

'use strict';

const util = require('util');
const fs = require('fs');
const Mailparser2 = require('../lib/mailparser2.js');

let parser = new Mailparser2();
let input = fs.createReadStream(__dirname + '/mimetorture.eml');

input.pipe(parser);

parser.on('headers', headers => {
    console.log(util.inspect(headers, false, 22));
});

parser.on('data', data => {
    if (data.type === 'text') {
        Object.keys(data).forEach(key => {
            console.log(key);
            console.log('----');
            console.log(data[key]);
        });
        fs.writeFileSync('/Users/andris/Desktop/out.html', data.html || '');
        fs.writeFileSync('/Users/andris/Desktop/out-text.html', data.textAsHtml || '');
        fs.writeFileSync('/Users/andris/Desktop/out.txt', data.text || '');
    }

    if (data.type === 'attachment') {
        console.log('ATTACHMENT');
        let size = 0;
        Object.keys(data).forEach(key => {
            if (typeof data[key] !== 'object' && typeof data[key] !== 'function') {
                console.log('%s: %s', key, JSON.stringify(data[key]));
            }
        });
        data.content.on('readable', () => {
            let chunk;
            while ((chunk = data.content.read()) !== null) {
                size += chunk.length;
            }
        });

        data.content.on('end', () => {
            console.log('%s: %s B', 'size', size);
            // attachment needs to be released before next chunk of
            // message data can be processed
            data.release();
        });
    }
});

parser.on('end', () => {
    console.log('READY');
});
