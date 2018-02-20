var path = require("path");

// export the routes to be used in express/json-server in app.js
module.exports = function() {
  const routes = {};
  const compressorJson = require(path.resolve(__dirname, '../sample-data/rmd-datasource/datagrid-compressor.json'));
  const summaryJson = require(path.resolve(__dirname, '../sample-data/rmd-datasource/summary-compressor.json'));
  // http://localhost:5000/mock-api/datagrid/asset/compressor-2017
  routes["asset/:id"] = compressorJson;

  // http://localhost:5000/mock-api/datagrid/asset/compressor-2017/summary
  routes["summary"] = summaryJson;
  routes["asset/:id/summary"] = summaryJson;

  // http://localhost:5000/mock-api/datagrid/group/plant-richmond-refinery
  routes["group/:id"] = require(path.resolve(__dirname, '../sample-data/rmd-datasource/datagrid-refinery.json'));

  // http://localhost:5000/mock-api/datagrid/group/plant-richmond-refinery/summary
  routes["group/:id/summary"] = require(path.resolve(__dirname, '../sample-data/rmd-datasource/summary-refinery.json'));
  return routes;
};
