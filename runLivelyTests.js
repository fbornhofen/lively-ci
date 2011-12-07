#!/usr/bin/env node

var http = require('http');
var spawn = require('child_process').spawn;

var Config = {
  host: 'localhost',
  port: '5984',
  lastResult: '/test_results/last_test_result',
  jobDocument: '/test_results/test_runner_job',
  browserExe: 'chromium-browser',
  browserArgs: ['--display', ':1', 'http://lively-kernel.org/repository/webwerkstatt/users/fbo/tests.xhtml'],
  xServerExe: 'Xvfb',
  xServerArgs: [':1'],
  interval: 3000 // Polling interval
};

// --------------------------------

var interval = Config.interval;
var testId = 12345;                    // TODO generate unique value
var reqOptions = {
  host: 'localhost',
  port: '5984',
  path: Config.lastResult 
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

function createTestRunnerJob(testId, modules) {
  var job = { testId: testId, modules: modules };
  var options = { 
    host: Config.host, 
    port: Config.port, 
    path: Config.jobDocument, 
    method: 'PUT' };
  var req = http.request(options, function() {});
  req.write(JSON.stringify(job));
  req.end();
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

createTestRunnerJob(testId, 'all');
requestResults();
var environment = spawnTestEnvironment();
// .... killTestEnvironment? process.exit takes care of it?
