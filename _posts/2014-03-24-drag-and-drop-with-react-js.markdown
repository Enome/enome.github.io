---
layout: post
title:  'Drag and drop custom data with React.js'
date:   2014-03-24 20:44:26
categories: javascript
---

In this post I'll be showing some tips and examples on how to pass custom data using React.js and the drag and drop API. If you want to drag and drop files from inside or outside the browser there are plenty of tutorials out there that will show you how to do this. The React.js API is based on the browser API so plain Javascript examples should be easy to convert.

## The drag
<p></p>
{% highlight js %}
var Drag = React.createClass({

  /* LOGIC */
  dragStart: function (event) {

    var data = {
      name: 'foobar',
      age: 15 
    };

    event.dataTransfer.setData('text', JSON.stringify(data)); 

  },

  /* RENDER */
  render: function () {
    return (
      <div draggable='true' onDragStart={this.dragStart}>Drag</div>
    );
  },

});
{% endhighlight %}

First of all you need to set `draggable='true'` on the element you want to drag. If you are dragging selected text, images or links you don't need the set the attribute since those elements are draggable by default. This also means that we need to handle those types inside our drop event (more below).

The next step is to define an `onDragStart` event and handler. For transferring the data we are using [DataTransfer](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer) object which all related events will be able to access. The first parameter of `setData` is the type, we set it to `text`. Because we are passing a string we need to stringify our object with `JSON.stringify`.

#### Custom types

Since I didn't want to run into a conflict with other draggable types (selected text, images, ...) I thought it would be a good idea to set a custom type.

{% highlight js %}
event.dataTransfer.setData('data', JSON.stringify(data)); 
{% endhighlight %}

While this seems to work in Chrome and Firefox it doesn't work in Internet Explorer (tested in IE 11). It will throw the very non-descriptive error `SCRIPT65535: Unexpected call to method or property access.`.


### The drop
<p></p>
{% highlight js %}
var Drop = React.createClass({

  /* LOGIC */
  preventDefault: function (event) {
    event.preventDefault();
  },

  drop: function (event) {

    event.preventDefault();

    var data;

    try {
      data = JSON.parse(event.dataTransfer.getData('text'));
    } catch (e) {
      // If the text data isn't parsable we'll just ignore it.
      return;
    }

    // Do something with the data
    console.log(data);

  },

  /* RENDER */
  render: function () {
    return (
      <div onDragOver={this.preventDefault} onDrop={this.drop}>
        Drop
      </div>
    );
  },

});
{% endhighlight %}

First we need to define the `onDragOver` event and handler and call `event.preventDefault()`. If you don't do this the drop event will **never fire** in Chrome which seems to be a [bug](https://code.google.com/p/chromium/issues/detail?id=168387).

Next you have to define `onDrop` which will handle the drop event. The `getData` method is returning our object as a JSON string so we need to parse it back to an object. And since our drop component can also take other draggable objects we need to try/catch the `JSON.parse` method. For example if somebody drops a file or link onto our component we want it to just ignore it (or show a UI warning if you are feeling fancy). Calling `event.preventDefault()` makes sure that the browser doesn't try and open the file or custom element.

### The demo  

<div id='drag'></div>
<div id='drop'></div>

[Demo code]({{site.url}}/assets/dnd/index.js)

### Extra: Passing a key instead of JSON data

If you don't want to serialize and de-serialize your data you can store it somewhere else, for example in a simple key/value object. Instead of passing around JSON data you pass around the key.

{% highlight js %}
var storage = {};

var Drag = React.createClass({
  dragStart: function (event) {

    var data = {
      name: 'foobar',
      age: 15 
    };

    var id = generateID(); // You can use a uuid library for this
    storage[id] = data;

    event.dataTransfer.setData('text', id); 
  }
  /* ... */
});

var Drop = React.createClass({
  /* ... */
  drop: function (event) {

    var id = event.dataTransfer.getData('text');
    var data = storage[id];

    if(typeof data !== 'undefined') {
      // Do something with the data
    }

  },
  /* ... */
});
{% endhighlight %}

This is useful if you want to access the same instance of an object in your drop handler or if your object has methods which won't get serialized by `JSON.stringify`.

<link href='{{site.url}}/assets/dnd/index.css' rel='stylesheet' />
<script src='http://fb.me/react-0.9.0.min.js'></script>
<script src='http://fb.me/JSXTransformer-0.9.0.js'></script>
<script src='{{site.url}}/assets/dnd/index.js' type='text/jsx'></script>
