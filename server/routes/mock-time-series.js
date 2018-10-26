var path = require("path");
var express = require("express")
var router = express.Router();

router.use(['/v1/datapoints', '/compression-ratio'], function(req, res) {
  // TODO: Add support to return different data based on request body. use body-parser
  // const compressorJson = require(path.resolve(__dirname, '../sample-data/time-series/Compressor-CMMS-Compressor-2018-compression-ratio.json'));
  const compressorJson = require(path.resolve(__dirname, '../sample-data/time-series/2-tags.json'));
  res.send(compressorJson);
});

module.exports = router;
