'use strict';

const mailsplit = require('mailsplit');
const libmime = require('libmime');
const addressparser = require('addressparser');
const Transform = require('stream').Transform;
const Splitter = mailsplit.Splitter;
const punycode = require('punycode');

const encodings = new Map([
    ['866', 'IBM866'],
    ['unicode-1-1-utf-8', 'UTF-8'],
    ['utf-8', 'UTF-8'],
    ['utf8', 'UTF-8'],
    ['cp866', 'IBM866'],
    ['csibm866', 'IBM866'],
    ['ibm866', 'IBM866'],
    ['csisolatin2', 'ISO-8859-2'],
    ['iso-8859-2', 'ISO-8859-2'],
    ['iso-ir-101', 'ISO-8859-2'],
    ['iso8859-2', 'ISO-8859-2'],
    ['iso88592', 'ISO-8859-2'],
    ['iso_8859-2', 'ISO-8859-2'],
    ['iso_8859-2:1987', 'ISO-8859-2'],
    ['l2', 'ISO-8859-2'],
    ['latin2', 'ISO-8859-2'],
    ['csisolatin3', 'ISO-8859-3'],
    ['iso-8859-3', 'ISO-8859-3'],
    ['iso-ir-109', 'ISO-8859-3'],
    ['iso8859-3', 'ISO-8859-3'],
    ['iso88593', 'ISO-8859-3'],
    ['iso_8859-3', 'ISO-8859-3'],
    ['iso_8859-3:1988', 'ISO-8859-3'],
    ['l3', 'ISO-8859-3'],
    ['latin3', 'ISO-8859-3'],
    ['csisolatin4', 'ISO-8859-4'],
    ['iso-8859-4', 'ISO-8859-4'],
    ['iso-ir-110', 'ISO-8859-4'],
    ['iso8859-4', 'ISO-8859-4'],
    ['iso88594', 'ISO-8859-4'],
    ['iso_8859-4', 'ISO-8859-4'],
    ['iso_8859-4:1988', 'ISO-8859-4'],
    ['l4', 'ISO-8859-4'],
    ['latin4', 'ISO-8859-4'],
    ['csisolatincyrillic', 'ISO-8859-5'],
    ['cyrillic', 'ISO-8859-5'],
    ['iso-8859-5', 'ISO-8859-5'],
    ['iso-ir-144', 'ISO-8859-5'],
    ['iso8859-5', 'ISO-8859-5'],
    ['iso88595', 'ISO-8859-5'],
    ['iso_8859-5', 'ISO-8859-5'],
    ['iso_8859-5:1988', 'ISO-8859-5'],
    ['arabic', 'ISO-8859-6'],
    ['asmo-708', 'ISO-8859-6'],
    ['csiso88596e', 'ISO-8859-6'],
    ['csiso88596i', 'ISO-8859-6'],
    ['csisolatinarabic', 'ISO-8859-6'],
    ['ecma-114', 'ISO-8859-6'],
    ['iso-8859-6', 'ISO-8859-6'],
    ['iso-8859-6-e', 'ISO-8859-6'],
    ['iso-8859-6-i', 'ISO-8859-6'],
    ['iso-ir-127', 'ISO-8859-6'],
    ['iso8859-6', 'ISO-8859-6'],
    ['iso88596', 'ISO-8859-6'],
    ['iso_8859-6', 'ISO-8859-6'],
    ['iso_8859-6:1987', 'ISO-8859-6'],
    ['csisolatingreek', 'ISO-8859-7'],
    ['ecma-118', 'ISO-8859-7'],
    ['elot_928', 'ISO-8859-7'],
    ['greek', 'ISO-8859-7'],
    ['greek8', 'ISO-8859-7'],
    ['iso-8859-7', 'ISO-8859-7'],
    ['iso-ir-126', 'ISO-8859-7'],
    ['iso8859-7', 'ISO-8859-7'],
    ['iso88597', 'ISO-8859-7'],
    ['iso_8859-7', 'ISO-8859-7'],
    ['iso_8859-7:1987', 'ISO-8859-7'],
    ['sun_eu_greek', 'ISO-8859-7'],
    ['csiso88598e', 'ISO-8859-8'],
    ['csisolatinhebrew', 'ISO-8859-8'],
    ['hebrew', 'ISO-8859-8'],
    ['iso-8859-8', 'ISO-8859-8'],
    ['iso-8859-8-e', 'ISO-8859-8'],
    ['iso-ir-138', 'ISO-8859-8'],
    ['iso8859-8', 'ISO-8859-8'],
    ['iso88598', 'ISO-8859-8'],
    ['iso_8859-8', 'ISO-8859-8'],
    ['iso_8859-8:1988', 'ISO-8859-8'],
    ['visual', 'ISO-8859-8'],
    ['csisolatin6', 'ISO-8859-10'],
    ['iso-8859-10', 'ISO-8859-10'],
    ['iso-ir-157', 'ISO-8859-10'],
    ['iso8859-10', 'ISO-8859-10'],
    ['iso885910', 'ISO-8859-10'],
    ['l6', 'ISO-8859-10'],
    ['latin6', 'ISO-8859-10'],
    ['iso-8859-13', 'ISO-8859-13'],
    ['iso8859-13', 'ISO-8859-13'],
    ['iso885913', 'ISO-8859-13'],
    ['iso-8859-14', 'ISO-8859-14'],
    ['iso8859-14', 'ISO-8859-14'],
    ['iso885914', 'ISO-8859-14'],
    ['csisolatin9', 'ISO-8859-15'],
    ['iso-8859-15', 'ISO-8859-15'],
    ['iso8859-15', 'ISO-8859-15'],
    ['iso885915', 'ISO-8859-15'],
    ['iso_8859-15', 'ISO-8859-15'],
    ['l9', 'ISO-8859-15'],
    ['iso-8859-16', 'ISO-8859-16'],
    ['cskoi8r', 'KOI8-R'],
    ['koi', 'KOI8-R'],
    ['koi8', 'KOI8-R'],
    ['koi8-r', 'KOI8-R'],
    ['koi8_r', 'KOI8-R'],
    ['koi8-ru', 'KOI8-U'],
    ['koi8-u', 'KOI8-U'],
    ['csmacintosh', 'macintosh'],
    ['mac', 'macintosh'],
    ['macintosh', 'macintosh'],
    ['x-mac-roman', 'macintosh'],
    ['dos-874', 'windows-874'],
    ['iso-8859-11', 'windows-874'],
    ['iso8859-11', 'windows-874'],
    ['iso885911', 'windows-874'],
    ['tis-620', 'windows-874'],
    ['windows-874', 'windows-874'],
    ['cp1250', 'windows-1250'],
    ['windows-1250', 'windows-1250'],
    ['x-cp1250', 'windows-1250'],
    ['cp1251', 'windows-1251'],
    ['windows-1251', 'windows-1251'],
    ['x-cp1251', 'windows-1251'],
    ['ansi_x3.4-1968', 'windows-1252'],
    ['ascii', 'windows-1252'],
    ['cp1252', 'windows-1252'],
    ['cp819', 'windows-1252'],
    ['csisolatin1', 'windows-1252'],
    ['ibm819', 'windows-1252'],
    ['iso-8859-1', 'windows-1252'],
    ['iso-ir-100', 'windows-1252'],
    ['iso8859-1', 'windows-1252'],
    ['iso88591', 'windows-1252'],
    ['iso_8859-1', 'windows-1252'],
    ['iso_8859-1:1987', 'windows-1252'],
    ['l1', 'windows-1252'],
    ['latin1', 'windows-1252'],
    ['us-ascii', 'windows-1252'],
    ['windows-1252', 'windows-1252'],
    ['x-cp1252', 'windows-1252'],
    ['cp1253', 'windows-1253'],
    ['windows-1253', 'windows-1253'],
    ['x-cp1253', 'windows-1253'],
    ['cp1254', 'windows-1254'],
    ['csisolatin5', 'windows-1254'],
    ['iso-8859-9', 'windows-1254'],
    ['iso-ir-148', 'windows-1254'],
    ['iso8859-9', 'windows-1254'],
    ['iso88599', 'windows-1254'],
    ['iso_8859-9', 'windows-1254'],
    ['iso_8859-9:1989', 'windows-1254'],
    ['l5', 'windows-1254'],
    ['latin5', 'windows-1254'],
    ['windows-1254', 'windows-1254'],
    ['x-cp1254', 'windows-1254'],
    ['cp1255', 'windows-1255'],
    ['windows-1255', 'windows-1255'],
    ['x-cp1255', 'windows-1255'],
    ['cp1256', 'windows-1256'],
    ['windows-1256', 'windows-1256'],
    ['x-cp1256', 'windows-1256'],
    ['cp1257', 'windows-1257'],
    ['windows-1257', 'windows-1257'],
    ['x-cp1257', 'windows-1257'],
    ['cp1258', 'windows-1258'],
    ['windows-1258', 'windows-1258'],
    ['x-cp1258', 'windows-1258'],
    ['chinese', 'GBK'],
    ['csgb2312', 'GBK'],
    ['csiso58gb231280', 'GBK'],
    ['gb2312', 'GBK'],
    ['gb_2312', 'GBK'],
    ['gb_2312-80', 'GBK'],
    ['gbk', 'GBK'],
    ['iso-ir-58', 'GBK'],
    ['x-gbk', 'GBK'],
    ['gb18030', 'gb18030'],
    ['big5', 'Big5'],
    ['big5-hkscs', 'Big5'],
    ['cn-big5', 'Big5'],
    ['csbig5', 'Big5'],
    ['x-x-big5', 'Big5'],
    ['cseucpkdfmtjapanese', 'EUC-JP'],
    ['euc-jp', 'EUC-JP'],
    ['x-euc-jp', 'EUC-JP'],
    ['csshiftjis', 'Shift_JIS'],
    ['ms932', 'Shift_JIS'],
    ['ms_kanji', 'Shift_JIS'],
    ['shift-jis', 'Shift_JIS'],
    ['shift_jis', 'Shift_JIS'],
    ['sjis', 'Shift_JIS'],
    ['windows-31j', 'Shift_JIS'],
    ['x-sjis', 'Shift_JIS'],
    ['cseuckr', 'EUC-KR'],
    ['csksc56011987', 'EUC-KR'],
    ['euc-kr', 'EUC-KR'],
    ['iso-ir-149', 'EUC-KR'],
    ['korean', 'EUC-KR'],
    ['ks_c_5601-1987', 'EUC-KR'],
    ['ks_c_5601-1989', 'EUC-KR'],
    ['ksc5601', 'EUC-KR'],
    ['ksc_5601', 'EUC-KR'],
    ['windows-949', 'EUC-KR'],
    ['utf-16be', 'UTF-16BE'],
    ['utf-16', 'UTF-16LE'],
    ['utf-16le', 'UTF-16LE']
]);

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

    normalizeCharset(charset) {
        charset = charset.toLowerCase().trim();

        // first pass
        if (encodings.has(charset)) {
            return encodings.get(charset);
        }

        charset = charset.
        replace(/^utf[\-_]?(\d+)/, 'utf-$1').
        replace(/^(?:us[\-_]?)ascii/, 'windows-1252').
        replace(/^win(?:dows)?[\-_]?(\d+)/, 'windows-$1').
        replace(/^(?:latin|iso[\-_]?8859)?[\-_]?(\d+)/, 'iso-8859-$1');

        // updated pass
        if (encodings.has(charset)) {
            return encodings.get(charset);
        }

        // unknown?
        return 'windows-1252';
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
                // node header block
                process.stdout.write(data.getHeaders());
                let headers = this.processHeaders(data.headers.getList());
                if (data.root && !this.headers) {
                    this.headers = headers;
                    this.emit('headers', headers);
                }
                break;
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
