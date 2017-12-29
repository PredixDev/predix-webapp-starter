
const fs = require("fs");
const path = require('path');
const request = require('request');
const config = require('../predix-config');
const assettemplatefile = "../sample-data/data-exchange/PutFieldDataCreateAsset-DataMap.json";

const cloneAsset = function(req, res) {
  var assetName = req.body[0].assetname;
  console.log("user entered asset name:", assetName);
  var now = Date.now();
  
  var rawClone = fs.readFileSync(path.join(__dirname, assettemplatefile), 'utf8');
  var uniqueRequestString = req.ip.replace(/:/g, '_') + '-' + now;
  var result = rawClone.replace(/compressor-2017/g, uniqueRequestString);
  var putFieldDataRequest = JSON.parse(result);
  putFieldDataRequest.putFieldDataCriteria[0].fieldData.data.map[0].description = assetName;
  putFieldDataRequest.putFieldDataCriteria[0].fieldData.data.map[0].createdDate = now;
  console.log('putFieldDataRequest', JSON.stringify(putFieldDataRequest));

  var options = { 
    method: 'POST',
    url: config.dataExchangeURL + '/services/fdhrouter/fielddatahandler/putfielddata',
    headers: { 
        'cache-control': 'no-cache',
        'Authorization' : req.headers['Authorization'],
        'content-type': 'application/json' 
    },
    json: putFieldDataRequest
  };
  
  request(options, function(err, response, body) {
    if (err) {
      console.error(err.message + err.stack);
      res.status(500).send(err.message);
    } else if (body && body.errorEvent && body.errorEvent.length > 0) {
      console.error('Error from data-exchange.', body.errorEvent[0]);
      res.status(500).send(body.errorEvent[0]);
    } else if (response.statusCode == 200 || response.statusCode == 204) {
      console.log('response from putfielddata:', body);
      res.status = response.statusCode;
      res.send({clonedAssetId: uniqueRequestString});
    } else {
      console.error('ERROR cloning asset: ' + JSON.stringify(response));
      res.sendStatus(response.statusCode);
    }
  });
};

module.exports = {
  cloneAsset: cloneAsset
};