#!/usr/bin/env python

import config
import json
import subprocess
import time
import urllib2
import random
import sys

config = config.Config

# ----- Test Env

def spawnTestEnvironment():
  xPid = subprocess.Popen(config.xCmd)
  time.sleep(config.pollInterval)
  browserPid = subprocess.Popen(config.browserCmd)
  return [xPid, browserPid]

def killTestEnvironment(environment):
  for pid in environment:
    pid.kill()

# ---- HTTP 

def buildOpener():
  passwordManager = urllib2.HTTPPasswordMgrWithDefaultRealm()
  passwordManager.add_password(None, \
                               'http://' + config.couchHost, \
                               config.couchUser, \
                               config.couchPass)
  handler = urllib2.HTTPDigestAuthHandler(passwordManager)
  return urllib2.build_opener(handler)

def httpPut(url, putData):
  request = urllib2.Request(url, data=putData)
  request.get_method = lambda: 'PUT'
  return buildOpener().open(request).read()

def httpGet(url):
  return buildOpener().open(url).read()

# ----

def putNewTestJob(testId):
  jobUrl = 'http://' + config.couchHost + '/' + \
           config.couchDb + '/' + config.couchJobDocument
  job = json.loads(httpGet(jobUrl))
  job['testId'] = testId
  job['modules'] = config.testModules
  httpPut(jobUrl, json.dumps(job))

def collectTestResults(testId, timeout):
  resultsUrl = 'http://' + config.couchHost + '/' + \
               config.couchDb + '/' + config.couchLatestResult
  results = json.loads(httpGet(resultsUrl))
  while results['testId'] != testId:
    if int(time.time()) > timeout:
      return None 
    time.sleep(config.pollInterval)
    results = json.loads(httpGet(resultsUrl))
  return results

def reportResults(results):
  print 'Tests run: ' + str(results['testsRun'])
  print 'Tests passed: ' + str(results['testsPassed'])
  print 'Tests failed: ' + str(results['testsFailed'])
  print 'message: ' + str(results['message'])
  if (results['testsFailed'] > 0):
    return -1
  return 0

# ----- main

if __name__ == '__main__':
  startTime = int(time.time())
  testId = random.randint(1000, 10000)
  print testId
  putNewTestJob(testId)
  env = spawnTestEnvironment()
  results = collectTestResults(testId, startTime + Config.timeout)
  if results == None:
    print "Test timed out after " + str(Config.timeout) + "s"
    sys.exit(-2)
  exitCode = reportResults(results)
  killTestEnvironment(env)
  sys.exit(exitCode)


