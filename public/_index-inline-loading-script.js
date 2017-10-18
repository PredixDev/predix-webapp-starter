// Below is a fast app loading script
// The script async & lazy-loads webcomponents-lite polyfill
// then checks for Polymer element
// then removes #splash div to reveal application UI in #app
(function() {

  // set some global variables for px-vis webworkers.
  window.Px = window.Px || {};
  window.Px.vis = window.Px.vis || {};
  window.Px.vis.workerUrl = '../../bower_components/px-vis/px-vis-worker.js';
  window.Px.vis.workerD3Url = '../../bower_components/pxd3/d3.min.js';

  // Wait for async loading of elements.html bundle
  var onWebComponentsLoaded = function() {
    var mainElementLink = document.querySelector('#main-element-import');
    if (mainElementLink.import && mainElementLink.import.readyState === 'complete') {
      onMainElementLoaded();
    } else {
      mainElementLink.addEventListener('load', onMainElementLoaded);
    }
  };

  // Remove #splash div and 'loading' class from body
  var onMainElementLoaded = function() {
    // Fade splash screen, then remove
    var splashEl = document.getElementById('splash');
    splashEl.parentNode.removeChild(splashEl);
  };

  // load webcomponents polyfills
  if ('registerElement' in document && 'import' in document.createElement('link') && 'content' in
    document.createElement('template')) {
    // browser has web components, no need to load webcomponents polyfill
    onWebComponentsLoaded();
  } else {
    // polyfill web components
    var polyfill = document.createElement('script');
    polyfill.async = true;
    polyfill.src = '../../bower_components/webcomponentsjs/webcomponents-lite.min.js';
    polyfill.onload = onWebComponentsLoaded;
    document.head.appendChild(polyfill);
  }

}());
