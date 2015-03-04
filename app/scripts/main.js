/* global pym, createStoryJS */

(function() {

  'use strict';

  var pymChild;

  function render() {

    createStoryJS({
      type:       'timeline',
      width:      '100%',
      height:     '450',
      source:     'https://docs.google.com/spreadsheet/pub?key=14nkQ9sICq_6r2itJZJhWQZpLHujucQ_ZEtsQZqGspH4&single=true&gid=0&output=html',
      embed_id:   'timeline-embed',
      css:        'http://cdn.knightlab.com/libs/timeline/latest/css/timeline.css',
      js:         'http://cdn.knightlab.com/libs/timeline/latest/js/timeline-min.js'
    });

    if (pymChild) {
      pymChild.sendHeight();
    }
  }

  function load() {
    pymChild = new pym.Child({
      renderCallback: render
    });
  }

  window.onload = load;
})();
