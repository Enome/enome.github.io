---
layout: post
title:  "Let's create our own router component with React.js"
date:   2014-05-09
categories: javascript
---

In this blog post I will show you how to create your own router component for React.js. You could use an existing component, but building your own router gives you a better understanding on how existing solutions work. 


## Application structure

Let's first think about how we would structure our project. For most of my React.js projects I have the following structure when not using a router.

```
components/
storage/
index.html
index.js
```

When dealing with a router I add a pages directory.  The pages will be React.js components as well, but they are very specific and you will mostly only use them in one place. Although if you are feeling fancy you could write a generic page component as well, but let's keep things simple and leave out as much abstraction as possible for now.

```
components/
storage/
pages/
index.html
index.js
```

Also since we are dealing with routes which could have data (params/querystrings) of their own we need to think about which components are allowed to receive those. One way would be to just create some sort of global object which all components can read from, but this would break encapsulation. In a perfect world only the page components should be able to access the route data and all other components should receive it by settings their props. 


## Router component

The way this component will work is that it will render another component (page) based on the url. We could write our own url matcher, but since there are so many router libraries out there it makes more sense to just use an existing one. For this example I am going to use [page.js](http://visionmedia.github.io/page.js/), but you can easily replace it with any other library you prefer. The React.js wiki has some links to other [libraries](https://github.com/facebook/react/wiki/Complementary-Tools#routing) with examples.


Let's start by creating a basic component and rendering it:

```js
/** @jsx React.DOM */

var React = require('react');
var page = require('page');

var Router = React.createClass({});

React.renderComponent(<Router />, document.querySelector('body'));
```

Next we'll setup our render method to return a component that's stored in state.

```js
{
  render: function () {
    return this.state.component;
  }
}
```

Since we are going to deal with routes inside `componentDidMount` the initial load of our component wont have `this.state.component` yet, so let's set a default value for that.

```js
{
  getInitialState: function () {
    return { component: <div />};
  }
}
```

If all goes well the first render should add an empty div to the document. 

Now we can start by defining our routes with page.js in `componentDidMount`.

```js
{
  componentDidMount: function () {

    page('/', function (ctx) {

    });

    page('/users/:id', function (ctx) {

    });

    page('*', function (ctx) {

    });

    page.start();

  }
}
```

If you are not familiar with page.js, the first three calls define the routes and `start()` will initialize the router. The `ctx` (context) parameter is the object that has info (params, querystring, ..) about the current route. It also has some fancy features like saving state if you want to chain routes, but we aren't going to use that.

Also since page.js uses [pushState](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history), you probably want to tell your web server to serve the same html file for each request. It's optional, but if you don't do this and you navigate to `/users/15` and then refresh your browser the server will return a 404 since pushState changed the url without telling the server.

I use the following Node.js script to start a server but you can use whatever you like:

```js
var http = require('http');
var express = require('express');
var browserify = require('browserify-middleware');

var app = express();

/* I mostly use browserify but you can use any module system you like or none at all */

app.get('/index.js', browserify(__dirname + '/index.js', { transform: ['reactify']}));

app.get('/index.css', function (req, res) {
  res.sendfile(__dirname + '/index.css');
});

/* This will serve index.html to any url. (except index.js and index.css) */

app.get('/*', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

http.createServer(app).listen(3000);
```

Don't forget to install the packages and start the server.

```sh
npm install express browserify-middleware
node server.js #starts server on port 3000
```

Alright lets add some meat (or aubergine if you are into that veggie stuff) to our defined routes:

```js
{
  componentDidMount: function () {

    var self = this;

    page('/', function (ctx) {
      self.setState({ component: <Page1 /> });
    });

    page('/users/:id', function (ctx) {
      self.setState({ component: <Page2 /> });
    });

    page('*', function (ctx) {
      self.setState({ component: <PageNotFound /> });
    });

    page.start();

  }
}
```

The idea is that when we visit one of our defined urls it updates `this.state.component` which will re-render the router component with our newly set component. The star (asterisk) route will catch any url so if we place it last we can use it to render a not found page.

This wont work yet since we didn't define our page components yet. I'll only show the `<Page2>` component because it's the most interesting since it takes data from the url.

```js
var Page2 = React.createClass({
  render: function () {
    return <div>{this.props.params.id}</div>
  }
});
```

As you can see this component expects a `params.id` prop so we need to hook this up in our defined routes.

```js
{
  componentDidMount: function () {

    var self = this;

    page('/', function (ctx) {
      self.setState({ component: <Page1 /> });
    });

    page('/users/:id', function (ctx) {
      self.setState({ component: <Page2 params={ctx.params} /> });
    });

    page('*', function (ctx) {
      self.setState({ component: <PageNotFound /> });
    });

    page.start();

  }
}
```

Depending on what you need in your pages you can use any component props to pass any data from the `ctx` object you want or you can even pass the whole object.

```js
page('/users/:id', function (ctx) {
  self.setState({ component: <Page2 ctx={ctx} /> });
});
```

The complete router component should look something like this:

```js
/** @jsx React.DOM */

var React = require('react');
var page = require('page');

var Page1 = React.createClass({});
var Page2 = React.createClass({});
var PageNotFound = React.createClass({});

var Router = React.createClass({

  componentDidMount: function () {

    var self = this;

    page('/', function (ctx) {
      self.setState({ component: <Page1 /> });
    });

    page('/users/:id', function (ctx) {
      self.setState({ component: <Page2 params={ctx.params} /> });
    });

    page('*', function (ctx) {
      self.setState({ component: <PageNotFound /> });
    });

    page.start();

  }

  getInitialState: function () {
    return { component: <div />};
  }

  render: function () {
    return this.state.component;
  }

});

React.renderComponent(<Router />, document.querySelector('body'));
```

That's it, you now know how to build your own router component, pretty easy no?

## Navigation

Because page.js uses pushState you can't just use links to navigate to different urls (you actually could with our server setup, but it will trigger a page reload). To navigate with page.js you call `page` with a string. I like to wrap it a handy navigation function which looks something like this:

```js
var page = require('page');

var navigate = function (url) {
  return function () {
    page(url);
  }
};

```

In our page components we can now use this function to navigate to different pages.

```js
var Page = React.createClass({
  render: function () {
    return (
      <div>
        <button onClick={navigate('/users/13')}>User 13</button>
      </div>
    );
  }
});
```

You also gain the benefit that if you ever want to use a different router library you just have to update your `navigate` function instead of replacing all the references to `page`.

## Transitions

If you are building a mobile application you probably want to add some transitions when you navigate to get that mobile feel. I am experimenting with a router component that uses [CSSTransitionGroup](http://facebook.github.io/react/docs/animation.html). I have a prototype over [here](https://github.com/Enome/react-router-transition-example) and an implementation over [here](https://github.com/Enome/lane). It's still somewhat experimental but it should give you an idea on how to use transitions with a router component.

## Extra

You probably noticed that defining routes can be a bit cumbersome so lets sprinkle some abstraction dust on our router component.

```js
/** @jsx React.DOM */

var React = require('react');
var page = require('page');

/* Component */

var Router = React.createClass({

  componentDidMount: function () {

    var self = this;

    this.props.routes.forEach(function (route) {

      var url = route[0];
      var Component = route[1];

      page(url, function (ctx) {
        self.setState({ 
          component: <Component params={ctx.params} querystring={ctx.querystring}> 
        });
      });

    });

    page.start();

  }

  getInitialState: function () {
    return { component: <div />};
  }

  render: function () {
    return this.state.component;
  }

});

/* Routes */

var routes = [
  ['/', Page1],
  ['/users/:id', Page2],
  ['*', PageNotFound ],
];

/* Render*/

React.renderComponent(<Router routes={routes} />, document.querySelector('body'));
```
<br />

## Conclusion

We build a basic component to deal with routes. It's a fairly common question in IRC and I think the main reason that we don't have a super popular router library yet is because people are still experimenting to see what works. I don't think we will see a popular routing library for basic stuff since it's really easy to do, but there are probably going to be some neat solutions in the near future. For example a router that's easy to setup on the server and client so your users get the benefit of a SPA, but google bot can still crawl your site.
