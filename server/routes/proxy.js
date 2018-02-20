/**
 * This module can be used to set up reverse proxying from client to Predix services.
 * It assumes only one UAA instance, one UAA client, and one instance of each service.
 * Use setUaaConfig() and setServiceConfig() for local development.
 * In cloud foundry, set the following environment vars: base64ClientCredential
 * Info for bound services is read from VCAP environment variables.
 */

var url = require('url');
var express = require('express');
var expressProxy = require('express-http-proxy');
var HttpsProxyAgent = require('https-proxy-agent');
var predixUaaClient = require('predix-uaa-client');
var predixConfig = require('../predix-config');
var router = express.Router();
var vcapServices = {};

var corporateProxyServer = process.env.http_proxy || process.env.HTTP_PROXY || process.env.https_proxy || process.env.HTTPS_PROXY;
var corporateProxyAgent;
if (corporateProxyServer) {
	corporateProxyAgent = new HttpsProxyAgent(corporateProxyServer);
}

var clientId = predixConfig.getClientIdFromEncodedString(process.env.base64ClientCredential);
var base64ClientCredential = process.env.base64ClientCredential;
var uaaURL = (function() {
	var vcapsServices = process.env.VCAP_SERVICES ? JSON.parse(process.env.VCAP_SERVICES) : {};
	var uaaService = vcapsServices[process.env.uaa_service_label || 'predix-uaa'];
	var uaaURL;

	if(uaaService) {
		uaaURL = uaaService[0].credentials.uri;
	}
	return uaaURL;
}) ();

// Pass a VCAPS object here if desired, for local config.
//  Otherwise, this module reads from VCAP_SERVICES environment variable.
var setServiceConfig = function(vcaps) {
	vcapServices = vcaps;
	setProxyRoutes();
};

var setUaaConfig = function(options) {
	if (predixConfig.isUaaConfigured()) {
		uaaURL = options.uaaURL || uaaURL;
		base64ClientCredential = options.base64ClientCredential || base64ClientCredential;
		clientId = predixConfig.getClientIdFromEncodedString(base64ClientCredential);
	}
};

var getClientToken = function(successCallback, errorCallback) {
	var clientSecret = predixConfig.getSecretFromEncodedString(base64ClientCredential);
	predixUaaClient.getToken(uaaURL + '/oauth/token', clientId, clientSecret).then(function (token) {
			successCallback(token.token_type + ' ' + token.access_token);
	}).catch(function (err) {
		console.error('ERROR fetching client token:', err);
		if (errorCallback) {
			errorCallback(err);
		}
	});
};

function cleanResponseHeaders (rsp, data, req, res, cb) {
	res.removeHeader('Access-Control-Allow-Origin');
	cb(null, data);
}

function buildDecorator(zoneId) {
	var decorator = function(req) {
		if (corporateProxyAgent) {
			req.agent = corporateProxyAgent;
		}
		req.headers['Content-Type'] = 'application/json';
		if (zoneId) {
			req.headers['Predix-Zone-Id'] = zoneId;
		}
		return req;
	};
	return decorator;
}

function isValidUrl(str) {
	var urlObj = url.parse(str);
	return urlObj.protocol === 'https:' && urlObj.host;
}

function getEndpointAndZone(key, credentials) {
	var out = {};
	// ugly code needed since vcap service variables are not consistent across services
	// TODO: all the other predix services
	if (key === 'predix-uaa') {
		// do nothing. authentication handled by the passport module.
		// return here, so we don't display a confusing log message.
		return out;
	} else if (key === 'predix-asset') {
		out.serviceEndpoint = isValidUrl(credentials.uri) ? credentials.uri : null;
		out.zoneId = credentials.zone['http-header-value'];
	} else if (key === 'predix-timeseries') {
		var urlObj = url.parse(credentials.query.uri);
		out.serviceEndpoint = urlObj.host ? urlObj.protocol + '//' + urlObj.host : null;
		out.zoneId = credentials.query['zone-http-header-value'];
	}
	if (!out.serviceEndpoint) {
		console.log('no proxy set for service: ' + key);
	}
	return out;
}

var setProxyRoute = function(key, credentials) {
	// console.log(JSON.stringify(credentials));
	var routeOptions = getEndpointAndZone(key, credentials);
	if (!routeOptions.serviceEndpoint) {
		return;
	}
	console.log('setting proxy route for key: ' + key);
	console.log('serviceEndpoint: ' + routeOptions.serviceEndpoint);
	// console.log('zone id: ' + routeOptions.zoneId);
	var decorator = buildDecorator(routeOptions.zoneId);

	router.use('/' + key, expressProxy(routeOptions.serviceEndpoint, {
		https: true,
		forwardPath: function (req) {
			console.log('req.url: ' + req.url);
			return req.url;
		},
		intercept: cleanResponseHeaders,
		decorateRequest: decorator
	}));
};

// Fetches client token, adds to request headers, and stores in session.
// Returns 403 if no session.
// Use this middleware to proxy a request to a secure service, using a client token.
var addClientTokenMiddleware = function(req, res, next) {
	function errorHandler(errorString) {
		var err = new Error(errorString);
 		err.status = 500;
 		next(err);
	}
	// console.log('proxy root route');
	if (req.session) {
		// console.log('session found.');
		// console.log('fetching client token');
		// getClientToken will returned a cached token if it's not expired
		// or renew if it has expired.
		getClientToken(function(token) {
			req.headers['Authorization'] = token;
			next();
		}, errorHandler);
	} else {
		next(res.sendStatus(403).send('Forbidden'));
	}
};

router.use(['/'], addClientTokenMiddleware);

// Adds user authorization token from passport to request
var addAccessTokenMiddleware = function (req, res, next) {
	if (req.session) {
		req.headers['Authorization'] = 'bearer ' + req.session.passport.user.ticket.access_token;
		next();
	} else {
		next(res.sendStatus(403).send('Forbidden'));
	}
};

// TODO: Support for multiple instances of the same service.
var setProxyRoutes = function() {
	var vcapString = process.env.VCAP_SERVICES;
	var serviceKeys = [];
	vcapServices = vcapString ? JSON.parse(vcapString) : vcapServices;
	console.log('vcaps: ' + JSON.stringify(vcapServices));

	serviceKeys = Object.keys(vcapServices);
	serviceKeys.forEach(function(key) {
		setProxyRoute(key, vcapServices[key][0].credentials);
	});
};
// TODO: only call this, if we find a vcapstring in environment?
setProxyRoutes();

// Use this to set up your own proxy route to your custom microservice.
// Path and arguments after the pathPrefix will be passed on to the target endpoint.
//  pathPrefix: the path that clients will call in your express app.
//  endpoint: the URL of your custom microservice.
//  targetPath: optional path to proxy to. if set, the pathPrefix will be replaced with targetPath.
// example usage:
//  customProxyMiddleware('/my-custom-api', 'https://my-custom-service.run.aws-usw02-pr.ice.predix.io')
//  customProxyMiddleware('/another-api', 'https://another-api.run.aws-usw02-pr.ice.predix.io', '/v3/special-api-path')
var customProxyMiddleware = function(pathPrefix, endpoint, targetPath) {
	console.log('custom endpoint: ' + endpoint);
	return expressProxy(endpoint, {
		https: true,
		forwardPath: function (req) {
			var path = req.url.replace(pathPrefix, targetPath || '');
			console.log('proxying to:', path);
			return path;
		},
		intercept: cleanResponseHeaders,
		decorateRequest: buildDecorator()
	});
};

module.exports = {
	router: router,
	setServiceConfig: setServiceConfig,
	setUaaConfig: setUaaConfig,
	customProxyMiddleware: customProxyMiddleware,
	addClientTokenMiddleware: addClientTokenMiddleware,
	addAccessTokenMiddleware: addAccessTokenMiddleware,
	expressProxy: expressProxy
};