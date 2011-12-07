#!/usr/bin/env node

var http = require('http');

var interval = 3000;
var testId = 12345;
var reqOptions = {
  host: 'localhost',
  port: '5984',
  path: '/test_results/last_test_result' 
};

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
  http.get(reqOptions, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk; });
    res.on('end', function(){
      onGetResults(data); });
  });
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

// TODO start browser and make it run tests

requestResults();
//process.exit(0)
