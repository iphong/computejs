computejs
=========

Advanced javascript compute engine for most modern browsers.


## How to use?

    
    <script src="compute.js"></script>

### Define new compute node

    var node = new Compute.Node('module.js');


### Creating clusters

    var cluster = new Compute.Cluster('worker.js', 4);
  
    // Add new worker to cluster
    cluster.fork();

### Inside module.js

    // Export methods which can be called directly from master thread.
    exports.foo = function( arg ) {
      // The return value will be passed as first argument in master's callback fn.
      return arg;
    }
    exports.dot = {
      notation: {
        method: function( callback ) {
          callback("Something");
        }
      }
    }

### Executing functions
    
    node.compute('foo', function(){
      // Callback when computation is complete
    });
    node.compute('dot.notation.method', function(){
      // Callback when computation is complete
    });
    
    // You can also bind node exported methods
    node.bind('foo');
    node.bind('dot.notation.method');
    
    node.foo('bar', function(result) {
      // Result should be "bar"
    }
    // Calling functions from a cluster is auto load distributed to all workers
    cluster.foo('bar', function(result) {
      // Result should be "bar"
    }
    node.dot.notation.method(function(result) {
      // result should be "Something"
    });

### Evented I/O transactions

Communication between master thread and worker's process can be done by emitting and listenning to events.

    // in module.js
    node.on('foo', function( arg ) {
      node.emit('bar', arg);
    }

    // in main app
    node.emit('foo', 'some value');
    node.on('bar', function( arg ) {
      console.log(arg);
    }


--------------------------------------
This library is developed by Phong Vu.

