/*global moment*/

window.dates = {

  new: function (s) {
    return moment(s).startOf('day');
  },

  format: function (d, f) {
    if (!d) {
      return '';
    }
    return moment(d).format(f || 'YYYY-MM-DD');
  },

  range: function (start, end) {

    var current = moment(start);
    var r = [];

    while (current <= end) {
      r.push(moment(current));
      current.add('days', 1);
    }

    return r;

  },

  middleRange: function (d, i) {

    var start_int, end_int;

    start_int = end_int = parseInt(i / 2, 10);

    if (i % 2 === 0) {
      end_int -= 1;
    }

    var start = moment(d).subtract('days', start_int);
    var end = moment(d).add('days', end_int);

    return window.dates.range(start, end);
    
  },

};
