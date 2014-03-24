/** @jsx React.DOM */

var React = window.React;

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
      <div className='drag' draggable='true' onDragStart={this.dragStart}>Drag</div>
    );
  },

});

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
    window.alert(JSON.stringify(data, null, 2));

  },

  /* RENDER */

  render: function () {
    return (
      <div className='drop' onDragOver={this.preventDefault} onDrop={this.drop}>Drop</div>
    );
  },

});

React.renderComponent(<Drop />, document.querySelector('#drop'));
React.renderComponent(<Drag />, document.querySelector('#drag'));
