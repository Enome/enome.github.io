---
layout: post
title:  'Lets make a datepicker with React.js'
date:   2014-04-08
categories: javascript
---

For a project I am working on I need to create a <a href='/assets/datepicker/datepicker.jpg'>datepicker (mockup)</a> for touch devices. In this post we will be focusing on **infinite scrolling** since that's the most interesting problem to solve. We'll also make it vertical instead of horizontal which simplifies the [css]({{site.url}}/assets/datepicker/index.css) a little (no floats or flexbox).

If you just want to see the **demo**, [skip](#demo) to the bottom of the page.

## The setup

We'll be using the following sizes:

<img src='/assets/datepicker/measurements.png' alt='measurements' />

If we translate this to html and css, it looks something like this:

```html
<div class='datepicker'>
  <div class='days' style='height: 100px; overflow: hidden;'>
    <div class='wrapper'>
      <div class='day' style='height: 20px;'>2014-01-01</div>
      <div class='day' style='height: 20px;'>2014-01-02</div>
      <div class='day selected' style='height: 20px;'>2014-01-03</div>
      <div class='day' style='height: 20px;'>2014-01-04</div>
      <div class='day' style='height: 20px;'>2014-01-05</div>
    </div>
  </div>
</div>
```

So we have 5 rows and select the middle row. In React.js that means we need to set 2 state properties: the **current date** and a **list of dates**.


```js
var Datepicker = React.createClass({
  getInitialState: function () {
    var today = dates.new();
    return {
      current: today,
      days: dates.middleRange(today, 5)
    };
  },
});
```

<small>I am using a few helper methods I created for moment.js in this example. You can find the code over [here]({{site.url}}/assets/datepicker/dates.js).</small>

In this case when our component starts, it will create a range of 5 dates with the today date as the third item.


Lets define our render method next and hook up some events and handlers.

```js

/* LOGIC */
scrollTo: function (date) {  
},

/* RENDER */
render: function () {

  var self = this;

  var days = this.state.days.map(function (day) {

    var clss = 'day';

    if (day.isSame(self.state.current)) {
      clss += ' selected';
    }

    return (
      <div className={clss} onClick={self.scrollTo.bind(null, day)}>
        {day.format('YYYY-MM-DD')}
      </div> 
    ); 
  });

  return (
    <div className='date-picker'>
      <div ref='days' className='days'>
        <div ref='wrapper' className='wrapper'>
          {days}
        </div>
      </div>
    </div>
  );
},

```

First we create our events from `this.state.days` and if one of the days matches `this.state.current` we add a `.selected` class. We also add an `onClick` handler on the rows that will bind our `scrollTo` method with that day's date.


## Scroll to infinity and beyond

Now that we have our component setup we can start by adding infinite scrolling. Since it depends if the date we are scrolling to is after or before the current date we need to check that first.


```js
up: function (date) {},
down: function (date) {},

scrollTo: function (date) {

  if (date.isAfter(this.state.current)) {
    this.down(date);
  }
 
  if (date.isBefore(this.state.current)) {
    this.up(date);
  }
},
```

I decided to put `up` and `down` into their own methods. You don't have to do that, but it helps to keep all the methods relatively small which mostly means they are easier to test. Lets implement `down` first.

### Going down

Lets say we have the following scenario:

<img src='{{site.url}}/assets/datepicker/down1.png' />

We are currently selecting the **3rd** of January and we want to scroll to the **5th**. Before we can start scrolling to the **5th** we also need to have the rows that contain the **6th** and **7th** of January in our DOM tree.

<img src='{{site.url}}/assets/datepicker/down2.png' />

Creating elements with React.js is done by adjusting the state so our `down` method has to define a new range.

```js
down: function (date) {
  var start = dates.new(this.state.current).subtract('days', 2);
  var end = dates.new(date).add('days', 2);
  var range = dates.range(start, end);

  this.setState({ 
    days: range,
    current: date,
  });
}
```

The **start date** of our new range will be the current date minus 2 days. The **end date** will be the date we are scrolling to plus 2 days. We then set `state.days` to our new range and `state.current` to the date we are scrolling to.

We end up with the following result:

<img src='{{site.url}}/assets/datepicker/down3.png' />

Now that our rows are added and the date we are scrolling to is highlighted, the next step will be to move our `div.wrapper` 40 pixels up so the new date is in the middle again. 

<img src='{{site.url}}/assets/datepicker/down4.gif' />

We know our datepicker has a constant of 5 rows, our new range is 7 rows, a row is 20 pixels and we need to move -40 pixels on the y-axis. If all goes well `(5 - 7) * 20` should give us `-40` back.

Lets add this to our `down` method:

```js
down: function (date) {
  var start = dates.new(this.state.current).subtract('days', 2);
  var end = dates.new(date).add('days', 2);
  var range = dates.range(start, end);

  this.setState({ 
    days: range,
    current: date,
  });

  var top = (5 - range.length) * 20;
}
```

We also need to access the DOM node of our wrapper element:

```js
var wrapper = this.refs.wrapper.getDOMNode();
```

Now that we have that reference and we know how many pixels we need to move up, we can add our animation.

First step of the animation is to clear the transition and reset the position of our wrapper. If you don't do this you'll get weird bouncy animations from previous scrolls styles on the wrapper element.


```js
wrapper.style.transition = 'none';
wrapper.style.transform = 'translate(0, 0)';
```

<small>You could also use margins instead of transformations but the latter will use hardware acceleration. This [blog post](http://blog.alexmaccaw.com/css-transitions) has a lot of information about css transitions.</small>

Next we can add the transition again and set the destination of our wrapper.

```js
setTimeout(function () {
  wrapper.classList.add('transition');
  wrapper.style.transform = 'translate(0, ' + top + 'px)';
}, 0);
```

<small>You need to do this inside a `setTimeout` otherwise it's instantaneous and the browser won't pick up on the changes.</small>

Our complete `down` method should look something like the following:

```js
down: function (date) {
  var start = dates.new(this.state.current).subtract('days', 2);
  var end = dates.new(date).add('days', 2);
  var range = dates.range(start, end);

  this.setState({ 
    days: range,
    current: date,
  });

  var top = (5 - range.length) * 20;
  var wrapper = this.refs.wrapper.getDOMNode();

  wrapper.style.transition = 'none';
  wrapper.style.transform = 'translate(0, 0)';

  setTimeout(function () {
    wrapper.style.transition = 'all 200ms linear';
    wrapper.style.transform = 'translate(0, ' + top + 'px)';
  }, 0);
},
```

<small>
If you used React.js before you might have noticed that we don't wait for the DOM elements to be created before animating the wrapper. If you want to make sure that the elements are actually created before animating the wrapper you can move the transition and transform code to `componentDidUpdate`. In this case I don't really expect any problems with race conditions so it's probably fine to just start moving the wrapper right away.
</small>

### Going up

The `up` method is almost the same as our `down` method but in reverse.

```js
up: function (date) {
  var start = dates.new(date).subtract('days', 2);
  var end = dates.new(this.state.current).add('days', 2);
  var range = dates.range(start, end);

  this.setState({ 
    days: range,
    current: date,
  });

  var top = (5 - range.length) * 20;
  var wrapper = this.refs.wrapper.getDOMNode();

  wrapper.style.transition = 'none';
  wrapper.style.transform = 'translate(0, ' + top + 'px)';

  setTimeout(function () {
    wrapper.style.transition = 'all 200ms linear';
    wrapper.style.transform = 'translate(0, 0)';
  }, 0);
},
```

<small>There is some duplication between the `up` and `down` method so you could extract the code they got in common into their own methods.</small>

<br />

<h3 id='demo'>The demo</h3>

You can find the code [here]({{site.url}}/assets/datepicker/index.js). The demo has extra buttons to show how flexible `scrollTo` is and an extra `animate` method to deal with cross browser transitions and transforms.

<div class='app'></div>

<link href='{{site.url}}/assets/datepicker/index.css' rel='stylesheet' />
<script src='//fb.me/react-0.9.0.min.js'></script>
<script src='//fb.me/JSXTransformer-0.9.0.js'></script>
<script src='//cdnjs.cloudflare.com/ajax/libs/moment.js/2.5.1/moment.min.js'></script>
<script src='{{site.url}}/assets/datepicker/dates.js'></script>
<script src='{{site.url}}/assets/datepicker/index.js' type='text/jsx'></script>
