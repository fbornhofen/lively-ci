#!/usr/bin/env node

var http = require('http');
var spawn = require('child_process').spawn;

var Config = require('./config');

// --------------------------------

var interval = Config.interval;
var testId = 12345; //Math.floor(Math.random());

function getAndDo(reqOptions, callback) {
  http.get(reqOptions, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk; });
    res.on('end', function(){
      callback(data); });
  });
}

function reportResults(report) {
  console.log('Run: ' + report.testsRun);
  console.log('Passed: ' + report.testsPassed);
  console.log('Failed: ' + report.testsFailed);
  console.log('Error: ' + report.testsError);
  var exitCode = 0;
  if (report.testsFailed > 0 || report.testsError > 0) {
    exitCode = -1;
  }
  setTimeout(function() { process.exit(exitCode); }, interval);
}

function requestResults() {
  var reqOptions = {
    host: Config.host,
    port: Config.port,
    path: Config.lastResult 
  };
  getAndDo(reqOptions, onGetResults);
}

function onGetResults(arg) {
  var report = JSON.parse(arg);
  if (!report) {
    console.error('Unable to get valid test results from CouchDB');
    process.exit(-1);
  }
  if (report.testId == testId) {
    reportResults(report);
  } else {
    setTimeout(requestResults, interval);
  }
}

function createTestRunnerJob(testId, modules) {
  // For now, we use curl to put job info into CouchDB
  var job = { testId: testId, modules: modules };
  var curlArgs = [
    '--digest', 
    '--user', 
    Config.couchDB.user, 
    'http://' + Config.couchDB.host + ':' + Config.couchDB.port + '/' + 
      Config.couchDB.dbName + '/' + Config.couchDB.jobDocument,
    '-d',
    '\'' + JSON.stringify(job) + '\''];
  spawn(Config.curlExe, curlArgs);
}

function spawnTestEnvironment() {
  var xServer = spawn(Config.xServerExe, Config.xServerArgs);
  var browser;
  setTimeout(function() {
    browser = spawn(Config.browserExe, Config.browserArgs);
  }, Config.interval);
  return { browser: browser, xServer: xServer };
}

function killTestEnvironment(environment) {
  if (environment.browser) { environment.browser.kill('SIGKILL') }
  if (environment.xServer) { environment.xServer.kill('SIGKILL') }
}

// main

console.log('testId: ' + testId);
createTestRunnerJob(testId, 'all');
//requestResults();
//var environment = spawnTestEnvironment();
// .... killTestEnvironment? process.exit takes care of it?
