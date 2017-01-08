'use strict';

const mailsplit = require('mailsplit');
const libmime = require('libmime');
const addressparser = require('addressparser');
const Transform = require('stream').Transform;
const Splitter = mailsplit.Splitter;
const punycode = require('punycode');

class Mailparser2 extends Transform {
    constructor(config) {
        let options = {
            readableObjectMode: true,
            writableObjectMode: false
        };
        super(options);

        this.options = config;
        this.mailsplit = new Splitter();
        this.finished = false;
        this.waitingEnd = false;

        this.headers = false;

        this.endReceived = false;
        this.reading = false;
        this.errored = false;

        this.tree = false;
        this.curnode = false;

        this.mailsplit.on('readable', () => {
            if (this.reading) {
                return false;
            }
            this.readData();
        });

        this.mailsplit.on('end', () => {
            this.endReceived = true;
            if (!this.reading) {
                this.endStream();
            }
        });

        this.mailsplit.on('error', err => {
            this.errored = true;
            if (typeof this.waitingEnd === 'function') {
                return this.waitingEnd(err);
            }
            this.emit('error', err);
        });
    }

    readData() {
        if (this.errored) {
            return false;
        }
        this.reading = true;
        let data = this.mailsplit.read();
        if (data === null) {
            this.reading = false;
            if (this.endReceived) {
                this.endStream();
            }
            return;
        }

        this.processChunk(data, err => {
            if (err) {
                if (typeof this.waitingEnd === 'function') {
                    return this.waitingEnd(err);
                }
                return this.emit('error', err);
            }
            setTimeout(() => this.readData(), 1000);
        });
    }

    endStream() {
        this.finished = true;
        if (typeof this.waitingEnd === 'function') {
            this.waitingEnd();
        }
    }

    _transform(chunk, encoding, done) {
        if (!chunk || !chunk.length) {
            return done();
        }

        if (this.mailsplit.write(chunk) === false) {
            return this.mailsplit.once('drain', () => {
                done();
            });
        } else {
            return done();
        }
    }

    _flush(done) {
        if (this.finished) {
            return done();
        }
        this.waitingEnd = done;
    }

    processHeaders(lines) {
        let headers = new Map();
        (lines || []).forEach(line => {
            let key = line.key;
            let value = ((libmime.decodeHeader(line.line) || {}).value || '').toString().trim();
            switch (key) {
                case 'content-type':
                case 'content-disposition':
                case 'dkim-signature':
                    value = libmime.parseHeaderValue(value);
                    Object.keys(value && value.params || {}).forEach(key => {
                        try {
                            value.params[key] = libmime.decodeWords(value.params[key]);
                        } catch (E) {
                            // ignore, keep as is
                        }
                    });
                    break;
                case 'date':
                    value = new Date(value);
                    if (!value || value.toString() === 'Invalid Date' || !value.getTime()) {
                        // date parsing failed :S
                        value = new Date();
                    }
                    break;
                case 'subject':
                    try {
                        value = libmime.decodeWords(value);
                    } catch (E) {
                        // ignore, keep as is
                    }
                    break;
                case 'references':
                    value = value.split(/\s+/).map(this.ensureMessageIDFormat);
                    break;
                case 'message-id':
                    value = this.ensureMessageIDFormat(value);
                    break;
                case 'in-reply-to':
                    value = this.ensureMessageIDFormat(value);
                    break;
                case 'priority':
                case 'x-priority':
                case 'x-msmail-priority':
                case 'importance':
                    key = 'priority';
                    value = this.parsePriority(value);
                    break;
                case 'from':
                case 'to':
                case 'cc':
                case 'bcc':
                case 'sender':
                case 'reply-to':
                case 'delivered-to':
                case 'return-path':
                    value = addressparser(value);
                    this.decodeAddresses(value);
                    break;
            }
            if (value) {
                if (!headers.has(key)) {
                    headers.set(key, [].concat(value || []));
                } else if (Array.isArray(value)) {
                    headers.set(key, headers.get(key).concat(value));
                } else {
                    headers.get(key).push(value);
                }
            }
        });

        // keep only the first value
        let singleKeys = ['message-id', 'from', 'sender', 'in-reply-to', 'reply-to', 'subject', 'date', 'content-disposition', 'content-type', 'priority'];

        headers.forEach((value, key) => {
            if (Array.isArray(value)) {
                if (singleKeys.includes(key) && value.length) {
                    headers.set(key, value[value.length - 1]);
                } else if (value.length === 1) {
                    headers.set(key, value[0]);
                }
            }
        });

        return headers;
    }

    parsePriority(value) {
        value = value.toLowerCase().trim();
        if (!isNaN(parseInt(value, 10))) { // support "X-Priority: 1 (Highest)"
            value = parseInt(value, 10) || 0;
            if (value === 3) {
                return 'normal';
            } else if (value > 3) {
                return 'low';
            } else {
                return 'high';
            }
        } else {
            switch (value) {
                case 'non-urgent':
                case 'low':
                    return 'low';
                case 'urgent':
                case 'high':
                    return 'high';
            }
        }
        return 'normal';
    }

    ensureMessageIDFormat(value) {
        if (!value.length) {
            return false;
        }

        if (value.charAt(0) !== '<') {
            value = '<' + value;
        }

        if (value.charAt(value.length - 1) !== '>') {
            value += '>';
        }

        return value;
    }

    decodeAddresses(addresses) {
        addresses.forEach(address => {
            address.name = (address.name || '').toString();
            if (address.name) {
                try {
                    address.name = libmime.decodeWords(address.name);
                } catch (E) {
                    //ignore, keep as is
                }
            }
            if (/@xn\-\-/.test(address.address)) {
                address.address = address.address.substr(0, address.address.lastIndexOf('@') + 1) + punycode.toUnicode(address.address.substr(address.address.lastIndexOf('@') + 1));
            }
            if (address.group) {
                this.decodeAddresses(address.group);
            }
        });
    }

    processChunk(data, done) {
        switch (data.type) {
            case 'node':
                {
                    // node header block
                    process.stdout.write(data.getHeaders());
                    let headers = this.processHeaders(data.headers.getList());
                    if (data.root && !this.headers) {
                        this.headers = headers;
                        this.emit('headers', headers);
                    }

                    break;
                }
            case 'data':
                // multipart message structure
                // this is not related to any specific 'node' block as it includes
                // everything between the end of some node body and between the next header
                process.stdout.write(data.value);
                break;
            case 'body':
                // Leaf element body. Includes the body for the last 'node' block. You might
                // have several 'body' calls for a single 'node' block
                process.stdout.write(data.value);
                break;
        }

        //console.log(util.inspect(data.value, false, 22));
        setImmediate(done);
    }
}

module.exports = Mailparser2;
