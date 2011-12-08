#!/usr/bin/env python

import config
import json
import subprocess
import time
import urllib2
import random

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

def collectTestResults(testId):
  resultsUrl = 'http://' + config.couchHost + '/' + \
               config.couchDb + '/' + config.couchLatestResult
  results = json.loads(httpGet(resultsUrl))
  while results['testId'] != testId:
    time.sleep(config.pollInterval)
    results = json.loads(httpGet(resultsUrl))
  return results

def reportResultsAndQuit(results):
  print json.dumps(results)

# ----- main

if __name__ == '__main__':
  testId = random.randint(1000, 10000)
  print testId
  putNewTestJob(testId)
  results = collectTestResults(testId)
  reportResultsAndQuit(results)
  #env = spawnTestEnvironment()
  #time.sleep(10)  
  #killTestEnvironment(env)


