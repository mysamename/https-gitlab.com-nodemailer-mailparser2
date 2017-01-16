'use strict';

const Mailparser2 = require('./mailparser2.js');

module.exports = (input, callback) => {
    let mail = {
        attachments: []
    };

    let parser = new Mailparser2();

    parser.on('headers', headers => {
        mail.headers = headers;
    });

    parser.on('data', data => {
        if (data.type === 'text') {
            Object.keys(data).forEach(key => {
                if (['text', 'html', 'textAsHtml'].includes(key)) {
                    mail[key] = data[key];
                }
            });
        }

        if (data.type === 'attachment') {
            mail.attachments.push(data);

            let chunks = [];
            let chunklen = 0;
            data.content.on('readable', () => {
                let chunk;
                while ((chunk = data.content.read()) !== null) {
                    chunks.push(chunk);
                    chunklen += chunk.length;
                }
            });

            data.content.on('end', () => {
                data.content = Buffer.concat(chunks, chunklen);
                data.release();
            });
        }
    });

    parser.on('end', () => {
        parser.updateImageLinks((attachment, done) => done(false, 'data:' + attachment.contentType + ';base64,' + attachment.content.toString('base64')), (err, html) => {
            if (err) {
                return callback(err);
            }
            mail.html = html;

            callback(null, mail);
        });
    });

    if (typeof input === 'string') {
        parser.end(Buffer.from(input));
    } else if (Buffer.isBuffer(input)) {
        parser.end(input);
    } else {
        input.pipe(parser);
    }
};
