/* global pym */

(function() {
  'use strict';

  var pymChild;

  function render() {

    // Add your JS here!

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
