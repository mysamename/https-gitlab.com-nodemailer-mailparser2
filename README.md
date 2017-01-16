# MailParser2

Advanced email parser for Node.js. Everything is handled as a stream which should make it able to parse even very large messages (100MB+) with relatively low overhead. This project is somewhat similar to [Mailparser](https://github.com/andris9/mailparser) even though it's a complete rewrite.

The module exposes two separate modes, a lower level `MailParser2` class and `simpleParser` function. The latter is simpler to use (hence the name) but is less resource efficient as it buffers attachment contents in memory.

## Install

```
npm install @nodemailer/mailparser2
```

## simpleParser

`simpleParser` is the easiest way to parse emails. You only need to provide a message source to get a parsed email structure in return. As an additional bonus all embedded images in HTML (eg. the images that point to attachments using cid: URIs) are replaced with base64 encoded data URIs, so the message can be displayed without any additional processing. Be aware though that this module does not do any security cleansing (eg. removing javascript and so on), this is left to your own application.

```javascript
const simpleParser = require('@nodemailer/mailparser2').simpleParser;
simpleParser(source, (err, mail)=>{})
```

or as a Promise:

```javascript
simpleParser(source).then(mail=>{}).catch(err=>{})
```

Where

  * **source** is either a stream, a Buffer or a string that needs to be parsed
  * **err** is the possible error object
  * **mail** is a structured email object

### mail object

Parsed `mail` object has the following properties

  * **headers** – a Map object with lowercase header keys
  * **subject** is the subject line (also available from the header `mail.headers.get('subject')`)
  * **from** is an address object for the From: header
  * **to** is an address object for the To: header
  * **cc** is an address object for the Cc: header
  * **bcc** is an address object for the Bcc: header (usually not present)
  * **date** is a Date object for the Date: header
  * **messageId** is the Message-ID value string
  * **inReplyTo** is the In-Reply-To value string
  * **reply-to** is an address object for the Cc: header
  * **references** is an array of referenced Message-ID values
  * **html** is the HTML body of the message. If the message included embedded images as cid: urls then these are all replaced with base64 formatted data: URIs
  * **text** is the plaintext body of the message
  * **textAsHtml** is the plaintext body of the message formatted as HTML
  * **attachments** is an array of attachments

### address object

Address objects have the following structure:

  * **value** an array with address details
    * **name** is the name part of the email/group
    * **address** is the email address
    * **group** is an array of grouped addresses
  * **text** is a formatted address string for plaintext context
  * **html** is a formatted address string for HTML context

**Example**

```javascript
{
    value: [
        {
            address: 'andris+123@kreata.ee',
            name: 'Andris Reinman'
        },
        {
            address: 'andris.reinman@gmail.com',
            name: ''
        }
    ],
    html: '<span class="mp_address_name">Andris Reinman</span> &lt;<a href="mailto:andris+123@kreata.ee" class="mp_address_email">andris+123@kreata.ee</a>&gt;, <a href="mailto:andris.reinman@gmail.com" class="mp_address_email">andris.reinman@gmail.com</a>',
    text: 'Andris Reinman <andris+123@kreata.ee>, andris.reinman@gmail.com'
}
```

### attachment object

Attachment objects have the following structure:

  * **filename** (if available) file name of the attachment
  * **contentType** MIME type of the message
  * **contentDisposition** content disposition type for the attachment, most probably "attachment"
  * **checksum** a MD5 hash of the message content
  * **size** message size in bytes
  * **headers** a Map value that holds MIME headers for the attachment node
  * **content** a Buffer that contains the attachment contents
  * **contentId** the header value from 'Content-ID' (if present)
  * **cid** contentId without &lt; and &gt;
  * **related** if true then this attachment should not be offered for download (at least not in the main attachments list)


## MailParser2

`MailParser2` is a lower-level email parsing class. It is a transform stream that takes email source as bytestream for the input and emits data objects for attachments and text contents.

```javascript
const MailParser2 = require('@nodemailer/mailparser2').MailParser2;
let parser = new MailParser2()
```
