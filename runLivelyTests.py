#!/usr/bin/env python

import config
import json
import subprocess
import time
import urllib2

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
  pass

# ----- main

if __name__ == '__main__':
  #env = spawnTestEnvironment()
  #time.sleep(10)  
  #killTestEnvironment(env)


