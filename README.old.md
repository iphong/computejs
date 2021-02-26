JS.Core # jamvn
=======

The core of your next great web application. Now you can do amazing
stuff you never thought you can for your browser.

FEATURES
--------

1. Class prototype and inheritance.
2. Multi-core processing with web workers.
3. Auto load-balanced core clustering.
4. Core Model View Controllers (progress).
5. Core Data API (progress).

USAGE
-----

Include the core.js script in your main application.

```HTML
<script src="js/core.js"></script>
```

CLASS PROTOTYPING
--------------------------------

Define Classes:
```JS	
var Person = Class.define({
  constructor: function( name, attrs ) {
    this.name = name;
  },
  eat: function() {},
  sleep: function() {},
  talk: function() {},
  walk: function() {}
});

var Pirate = Person.extend({
  constructor: function( name, attrs ) {
    // construct more properties here
  },
  fight: function() {},
  drink: function() {}
});

var Captain = Pirate.extend({
  sail: function() {},
  fire: function() {}
});
```
Add methods to existing classes:
```JS
Person.fn.run = function() {};
Pirate.fn.kill = function() {};
// Method override
Captain.fn.kill = function() {};
```

WEB-WORKERS & CLUSTERS
----------------------

Fork new Worker from main app:
```JS
var worker = new Core.Worker('js/worker.js');
```
Inside "worker.js"
```JS
importScripts('core.js');

function foo( num ) {
  return num * 2;
};

function upload( file ) {
  read_file(file, function( buffer ) {
    parse_file(buffer, function (data) {
      upload_file(buffer, data, function(response) {
        worker.complete(response);
      });
    });
  });
};
```
Call worker functions from main app:
```JS
worker.exec('foo', 20, function( result ) {
  console.log(result);
  // --> 40
});

// Bind worker function for easy access
worker.bind('upload');

worker.upload(file); // is the same as -> worker.exec('upload', file);

worker.upload(file).complete(function( response ) {
  // Handling response returns from worker here
});
```
Creating workers cluster
```JS
var cluster = new Core.Cluster('js/worker.js', 8);
```
Calling functions is the same for single worker. The only different is
that requests are queued and distributed to the next available worker,
in order it was given until the stack is clear.
```JS
for (var i=0; i<40; i++) {
  cluster.exec('foo', i*2, function(result) {
    // result of each call are returned here.
  });
}
```
DATA BUFFERS & DATAVIEW
---------------------------------------------

Data Buffers:
This works the exact same way as in Node.js
```JS
var buffer = new Core.Buffer('some unicode string with special chars', 'utf-8');
var buffer = new Core.Buffer('0F9C8DFF00040589ACFE', 'hex8');

buffer.toString('hex');
buffer.toString('base64');
buffer.toString('ascii');
```
Support string types: UTF-8, HEX, BASE64, ASCII, BINARY, ARRAY BUFFER

The toString() method can convert to any type and from any type mentioned above.

DataView:
This is the enhanced version of native DataView
```JS
var view = new Core.DataView(buffer);

// Examples
view.seek(10);
view.getString( 4, view.tell());
view.getChar16( view.tell());
view.getUint8( 30 );
view.setUint8( 20, 190 );
view.getUint16( 256, true );
view.slice( 256, 4096 );
```
