'use strict';

const util = require('util');
const fs = require('fs');
const Mailparser2 = require('../lib/mailparser2.js');

let parser = new Mailparser2();
let input = fs.createReadStream(__dirname + '/large_out.eml');

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
            setTimeout(() => data.release(), 100);
        });
    }
    //attachment.release();
    //attachment.content.pipe(process.stdout);
});

parser.on('end', () => {
    console.log('READY');
});
