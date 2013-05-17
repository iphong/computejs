//     ComputeJS 0.0.1

//     (c) 2013 Phong Vu, Jam.vn.
//     ComputeJS may be freely distributed under the MIT license.
//     For all details and documentation:
//     https://github.com/iphong/computejs

void function( root ) {
  
	var window = root.window;
	var document = root.document;
	
	var previousCompute = root.Compute;
	
	// Utilities
	// ---------
	
	const PROTO_SUPPORT = !Object.prototype.isPrototypeOf({__proto__ : null});
	
	var array = [];
	var object = {};
	var pop = array.pop;
	var shift = array.shift;
	var slice = array.slice;
	var splice = array.splice;
	var hasOwnProperty = object.hasOwnProperty;
	
	function unshift( obj ) {
		var obj = slice.call(obj);
		array.unshift.apply(obj, slice.call(arguments,1));
		return obj;
	};
	function each( obj, iterator, context ) {
		if (obj == null) return;
		if (array.forEach && obj.forEach === array.forEach) {
			obj.forEach(iterator, context);
		} else if (obj.length === +obj.length) {
			for (var i = 0, l = obj.length; i < l; i++) {
				if (iterator.call(context, obj[i], i, obj) === {}) return;
			}
		} else {
			for (var key in obj) {
				if (hasOwnProperty.call(obj, key)) {
					if (iterator.call(context, obj[key], key, obj) === {}) return;
				}
			}
		}
	};
	function repeat( count, iterator, context ) {
		var i = 0;
		while (i++ < count)
			iterator.call(context, i);
	};
	function extend( obj ) {
		var obj = obj || {},
			args = slice.call(arguments, 1),
			props;
		while (props = args.shift())
			if (props instanceof Object)
				for (var key in props)
					obj[key] = props[key];
		return obj;
	};
	function defer( func, context ) {
		var args = slice.call(arguments, 2);
		setTimeout(function() {
			func.apply(context, args);
		}, 0);
	};
	function inherits( parent, ctor ) {
		PROTO_SUPPORT ?
			ctor.prototype.__proto__ = parent.prototype:
			ctor.prototype = new parent;
		return ctor;
	};
	function getValue( obj, ns ) {
		var prop, sub = obj;
		var ns = ns.split('.');
		while (prop = ns.shift())
			if (sub.hasOwnProperty(prop))
				sub = sub[prop];
			else
				return undefined;
		return sub;
	};
	function setValue( obj, ns, value ) {
		if (typeof ns === 'object') {
			return each(ns, function(value, ns) {
				setValue(obj, ns, value);
			});
		}
		var key, sub = obj;
		var ns = ns.split('.');
		while (key = ns.shift()) {
			sub[key] || (sub[key] = {});
			ns.length ? (sub = sub[key]) : (sub[key] = value);
		}
		return value;
	};
	function wipe( obj ) {
		for (var key in obj)
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				obj[key] = undefined;
				delete obj[key];
			}
		obj.__proto__ = null;
	};
	
	root.wipe = wipe;
	
	// Support Libraries
	// ----------------------
	
	var path = {
		
		sep: '/',
		delimiter: ':',
		splitPathRe: /^(\/?)([\s\S]+\/(?!$)|\/)?((?:\.{1,2}$|[\s\S]+?)?(\.[^.\/]*)?)$/,
		
		splitPath: function (filename) {
			var result = this.splitPathRe.exec(filename);
			return [result[1] || "", result[2] || "", result[3] || "", result[4] || ""]
		},
		normalizeArray: function (parts, allowAboveRoot) {
			var up = 0;
			for(var i = parts.length - 1; i >= 0; i--) {
				var last = parts[i];
				if(last === ".") {
					parts.splice(i, 1)
				} else {
					if(last === "..") {
						parts.splice(i, 1);
						up++
					} else {
						if(up) {
							parts.splice(i, 1);
							up--
						}
					}
				}
			}
			if(allowAboveRoot) {
				for(; up--; up) {
					parts.unshift("..")
				}
			}
			return parts
		},
		resolve: function() {
			var resolvedPath = "",
				resolvedAbsolute = false;
			for(var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
				var path = (i >= 0) ? arguments[i] : "/";
				if(typeof path !== "string" || !path) {
					continue
				}
				resolvedPath = path + "/" + resolvedPath;
				resolvedAbsolute = path.charAt(0) === "/"
			}
			resolvedPath = this.normalizeArray(resolvedPath.split("/").filter(function (p) {
				return !!p
			}), !resolvedAbsolute).join("/");
			return((resolvedAbsolute ? "/" : "") + resolvedPath) || "."
		},
		relative: function( from, to ) {
			from = this.resolve(from).substr(1);
			to = this.resolve(to).substr(1);
	
			function trim(arr) {
				var start = 0;
				for(; start < arr.length; start++) {
					if(arr[start] !== "") {
						break
					}
				}
				var end = arr.length - 1;
				for(; end >= 0; end--) {
					if(arr[end] !== "") {
						break
					}
				}
				if(start > end) {
					return []
				}
				return arr.slice(start, end - start + 1)
			}
			var fromParts = trim(from.split("/"));
			var toParts = trim(to.split("/"));
			var length = Math.min(fromParts.length, toParts.length);
			var samePartsLength = length;
			for(var i = 0; i < length; i++) {
				if(fromParts[i] !== toParts[i]) {
					samePartsLength = i;
					break
				}
			}
			var outputParts = [];
			for(var i = samePartsLength; i < fromParts.length; i++) {
				outputParts.push("..")
			}
			outputParts = outputParts.concat(toParts.slice(samePartsLength));
			return outputParts.join("/")
		},
		normalize: function(path) {
			var isAbsolute = path.charAt(0) === "/",
				trailingSlash = path.substr(-1) === "/";
			path = this.normalizeArray(path.split("/").filter(function (p) {
				return !!p
			}), !isAbsolute).join("/");
			if(!path && !isAbsolute) {
				path = "."
			}
			if(path && trailingSlash) {
				path += "/"
			}
			return(isAbsolute ? "/" : "") + path
		},
		basename: function( path, ext ) {
			var f = this.splitPath(path)[2];
			if(ext && f.substr(-1 * ext.length) === ext) {
				f = f.substr(0, f.length - ext.length)
			}
			return f
		},
		dirname: function(path) {
			var result = this.splitPath(path),
				root = result[0],
				dir = result[1];
			if(!root && !dir) {
				return "."
			}
			if(dir) {
				dir = dir.substr(0, dir.length - 1)
			}
			return root + dir
		},
		extname: function(path) {
			return this.splitPath(path)[3];
		},
		join: function() {
			var paths = slice(arguments);
			return this.normalize(paths.filter(function (p, index) {
				return p && typeof p === "string"
			}).join("/"))
		}
	};
	
	
	
	// Export module for CommonJS and the Browser
	// ------------------------------------------
	var Compute = typeof exports !== 'undefined' ?
		
		exports : root.Compute = new (function Compute() { this.__proto__ = null });
	
	// Current version of Compute.JS
	Compute.version = '0.0.1';
	
	// Run Compute in no-conflict mode
	Compute.noConflict = function() {
	  root.Compute = previousCompute;
	  return this;
	};
	
	// Check to see this script is running from master UI thread
	Compute.isMaster = function() {
		return window !== undefined && document !== undefined;
	};
	
	
	Compute.MAX_ERRORS = 10;
	Compute.ERRORS_CAUGHT = 0;
	
	
	// Compute EventEmitter
	// --------------------
	
	// This is basically copied from Backbone.Events
	
	var EventEmitter = Compute.EventEmitter = function EventEmitter() {};
	
	// Regular expression used to split event strings.
	var eventSplitter = /\s+/;
	
	// Implement fancy features of the Events API such as multiple event
	// names `"change blur"` and jQuery-style event maps `{change: action}`
	// in terms of the existing API.
	var eventsApi = function (obj, action, name, rest) {
		if (!name) return true;
		if (typeof name === 'object') {
			for (var key in name) {
				obj[action].apply(obj, [key, name[key]].concat(rest));
			}
		} else if (eventSplitter.test(name)) {
			var names = name.split(eventSplitter);
			for (var i = 0, l = names.length; i < l; i++) {
				obj[action].apply(obj, [names[i]].concat(rest));
			}
		} else {
			return true;
		}
	};
	
	// Optimized internal dispatch function for triggering events. Tries to
	// keep the usual cases speedy (most Backbone events have 3 arguments).
	var triggerEvents = function (obj, events, args) {
		var ev, i = -1,
			l = events.length;
		switch (args.length) {
		case 0:
			while (++i < l)(ev = events[i]).callback.call(ev.ctx);
			return;
		case 1:
			while (++i < l)(ev = events[i]).callback.call(ev.ctx, args[0]);
			return;
		case 2:
			while (++i < l)(ev = events[i]).callback.call(ev.ctx, args[0], args[1]);
			return;
		case 3:
			while (++i < l)(ev = events[i]).callback.call(ev.ctx, args[0], args[1], args[2]);
			return;
		default:
			while (++i < l)(ev = events[i]).callback.apply(ev.ctx, args);
		}
	};
	
	var invokeEvent = function( objects, event, args ) {
		each(objects, function( obj ) {
			EventEmitter.prototype.trigger.apply(obj, unshift(args, event));
		});
	};
	
	extend(EventEmitter.prototype, {
		
		on: function (name, callback, context) {
			if (!(eventsApi(this, 'on', name, [callback, context]) && callback)) return this;
			this._events || (this._events = {});
			var list = this._events[name] || (this._events[name] = []);
			list.push({
				callback: callback,
				context: context,
				ctx: context || this
			});
			return this;
		},
		
		off: function (name, callback, context) {
			var list, ev, events, names, i, l, j, k;
			if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
			if (!name && !callback && !context) {
				this._events = {};
				return this;
			}
			names = name ? [name] : Object.keys(this._events);
			for (i = 0, l = names.length; i < l; i++) {
				name = names[i];
				if (list = this._events[name]) {
					events = [];
					if (callback || context) {
						for (j = 0, k = list.length; j < k; j++) {
							ev = list[j];
							if ((callback && callback !== (ev.callback._callback || ev.callback)) || (context && context !== ev.context)) {
								events.push(ev);
							}
						}
					}
					this._events[name] = events;
				}
			}
			return this;
		},
		
		once: function (name, callback, context) {
			if (!(eventsApi(this, 'once', name, [callback, context]) && callback)) return this;
			this.on(name, function once() {
				this.off(name, once, context);
				callback.apply(context, arguments);
			}, context);
			this._callback = callback;
			return this;
		},
		
		trigger: function (name) {
			if (!this._events) return this;
			var args = slice.call(arguments, 1);
			if (!eventsApi(this, 'trigger', name, args)) return this;
			var events = this._events[name];
			var allEvents = this._events.all;
			if (events) triggerEvents(this, events, args);
			if (allEvents) triggerEvents(this, allEvents, arguments);
			return this;
		},
		
		listenTo: function (object, events, callback) {
			var listeners = this._listeners || (this._listeners = {});
			var id = object._listenerId || (object._listenerId = Core.uniqueID('li'));
			listeners[id] = object;
			object.on(events, callback || this, this);
			return this;
		},
		
		stopListening: function (object, events, callback) {
			var listeners = this._listeners;
			if (!listeners) return;
			if (object) {
				object.off(events, callback, this);
				if (!events && !callback) delete listeners[object._listenerId];
			} else {
				for (var id in listeners) {
					listeners[id].off(null, null, this);
				}
				this._listeners = {};
			}
			return this;
		}
	});
	
	
	
	
	// Compute Tasks
	// --------------------
	
	var TaskList = Compute.TaskList = function Compute_TaskList() {
		this.__proto__ = null;
	};
	
	var Task = Compute.Task = inherits( EventEmitter, function Compute_Task( type, args ) {
		array.push.call(this,type)
		each(args, function( arg, i ) {
			typeof arg === 'function' ? this.done(arg) : array.push.call(this,arg);
		}, this);
	});
	
	extend(Task.prototype, {
		
		done: function( callback, context ) {
			this.on('complete', callback, context);
			return this;
		}
	});
	
	// Compute NodeList
	// --------------------
	
	
	// Compute Node
	// --------------------
	
	var idCounter = 0;
	
	var NodeList = Compute.NodeList = function Compute_NodeList() {
		this.__proto__ = null;
	};
	
	var Node = Compute.Node = inherits( EventEmitter, function Compute_Node( filename, options ) {
		
		if (!(this instanceof Compute_Node))
			return new Compute_Node(filename, options);
			
		if (!filename)
			throw "Missing argument[0]: path to compute module is required.";
		
		var node = this;
		var worker = null;
		
		options || (options = {});
		
		this.id = idCounter++;
		this.tasks = new TaskList;
		
		this.__defineSetter__('worker', function( obj ) {
			worker = obj;
		});
		this.__defineGetter__('worker', function() {
		
			if (!worker) {
				worker = new Worker(Compute.script);
				worker.postMessage(['node:init', path.resolve(path.dirname(Compute.script), filename),options]);
				worker.addEventListener('message', function(event) {
					
					var args = slice.call(event.data);
					var type = args.shift();
					
					switch (type) {
						case 'node:event':
							return node.trigger.apply(node, args);
						case 'node:debug':
							return console.debug.apply(console, unshift(args, 'node('+node.id+')'));
						case 'node:warn':
							return console.warn.apply(console, unshift(args, 'node('+node.id+')'));
						case 'node:log':
							return console.log.apply(console, unshift(args, 'node('+node.id+')'));
						case 'compute:value':
							if (!node.active) return;
							invokeEvent([node.active], 'complete', args);
							invokeEvent([node], 'compute:value', unshift(args, node));
							node.active = null;
							node.next()
							return;
					}
				});
				worker.addEventListener('error', function(event) {
					node.trigger('error', {
						lineno: event.lineno,
						filename: filename,
						message: event.message,
						task: node.active
					});
					!node.active || node.push(node.active);
					node.active = null;
					node.worker = null;
					
					if (++Compute.ERRORS_CAUGHT < Compute.MAX_ERRORS)
						node.next();
					else
						throw "THE NUMBER OF ERRORS ALLOWED HAS MAXED OUT.";
				});
			}
			return worker;
		});
	});
	
	extend(Node.prototype, {
		
		emit: function() {
			this.worker.postMessage(unshift(arguments, 'node:event'));
			return this;
		},
		
		kill: function() {
			this.worker.terminate();
			this.worker = null;
		},
		
		next: function() {
			if (!this.active) {
				if (this.tasks.length) {
					this.active = array.shift.call(this.tasks);
					this.worker.postMessage(slice.call(this.active));
				}
			}
			return this;
		},
		
		push: function( task ) {
			array.push.call(this.tasks, task);
			this.next();
			return this;
		},
		
		bind: function( ns ) {
			var self = this;
			return setValue(this, ns, function() {
				return self.compute.apply(self, unshift(arguments, ns));
			});
		},
		
		compute: function() {
			var task = new Task('node:compute', arguments);
			this.push(task);
			return task;
		}
	});
	
	
	// Compute Cluster
	// --------------------
	
	var Cluster = Compute.Cluster = inherits( Node, function Compute_Cluster( filename, num, options ) {
	
		if (!(this instanceof Compute_Cluster))
			return new Compute_Cluster(filename, num, options);
			
		if (!filename)
			throw "Missing argument[0]: path to compute module is required.";
		
		if (typeof num == 'object')
			var options = num, num = 1;
		
		this.filename = filename;
		this.options = options;
		this.nodes = new NodeList;
		this.tasks = new TaskList;
		this.fork(num);
	});
	
	extend(Cluster.prototype, {
		
		fork: function( num ) {
			typeof num == 'number' || (num = 1);
			while (num--) {
				void function( node ) {
					node.cluster = this;
					node.tasks = this.tasks;
					array.push.call(this.nodes, node);
					node.on('all', function( event ) {
						this.trigger.apply(this, unshift(slice.call(arguments, 1), event, node));
					}, this);
				}.call(this, new Node(this.filename, this.options));
			}
			return this;
		},
		
		node: function( id ) {
			return array.filter.call(this.nodes, function( node ) {
				return node.id == id;
			})[0];
		},
		
		emit: function() {
			each(this.nodes, function(node) {
				node.emit.apply(node, this);
			}, arguments);
			return this;
		},
		
		next: function() {
			each(this.nodes, function(node) {
				node.next();
			});
			return this;
		}
		
	});
	
	
	// Compute Scope
	// --------------------
	
	var Context = Compute.Context = inherits( EventEmitter, function Compute_Context( filename ) {
	
		if (!(this instanceof Compute_Context))
			return new Compute_Context;
		
		this.exports = {};
		this.filename = filename || location.pathname;
		
	});
	
	
	// Compute Scope
	// --------------------
	
	var Module = Compute.Module = inherits( EventEmitter, function Compute_Module( filename, parent, scope ) {
	
		if (!(this instanceof Compute_Module))
			return new Compute_Module(filename, parent, scope);
		
		this.filename = filename;
		
		this.module = this;
		this.parent = parent;
		this.exports = {};
		
		var req = new XMLHttpRequest;
		req.open('GET', filename, false);
		req.send();
		
		var source = req.status === 200 ? req.response : null;
		var context = 'with (global) { with(scope) { eval(source); } }';
		var scope = this.scope = scope || {};
		
		Function('global', 'scope', 'source', '__dirname', context).call(root, this, scope, source, path.dirname(filename));
		
		return this.exports;
		
	});
	
	
	extend(Module.prototype, {
		
		__proto__: null,
		
		require: function( filename ) {
			var filename = path.resolve(path.dirname(this.parent.filename), filename);
			return Module(filename, this, this.scope);
		}
	});
	
	
	// Initialize Compute
	// ---------------------
	
	switch (Compute.isMaster()) {
		case true:
			
			Compute.script = array.pop.call(document.querySelectorAll('script')).getAttribute('src')
			
			require = function( filename ) {
				return new Module(filename, new Context(Compute.script), {});
			};
			
		break;
		case false:
			
			root.node = new Context(location.pathname);
			
			root.require = function( filename ) {
				return Module(filename, node, node.scope);
			};
			root.emit = function() {
				postMessage(unshift(arguments, 'node:event'));
			};
			root.log = node.log = function() {
				postMessage(unshift(arguments, 'node:log'));
			};
			root.debug = node.debug = function() {
				postMessage(unshift(arguments, 'node:debug'));
			};
			root.warn = node.warn = function() {
				postMessage(unshift(arguments, 'node:warn'));
			};
			root.addEventListener('message', function(event) {
				
				var args = slice.call(event.data);
				var type = args.shift();
				
				switch (type) {
					case 'node:init': 
						var filepath = path.resolve(path.dirname(node.filename), args.shift());
						var options = args.shift();
						
						node.scope = options.scope || {};
						node.exports = require(filepath);
					break;
					case 'node:event':
						node.trigger.apply(node, args);
					break;
					case 'node:compute':
						var func = getValue(node.exports, args.shift());
							
						node.once('compute:value', function() {
							postMessage(unshift(arguments, 'compute:value'));
						});
						args.push(node.trigger.bind(node, 'compute:value'));
						if (typeof func === 'function') {
							var result = func.apply(node, args);
							if (result !== undefined)
								node.trigger('compute:value', result);
						}
					break;
				}
			}, true);
			
		break;
	}
	
} (this);
