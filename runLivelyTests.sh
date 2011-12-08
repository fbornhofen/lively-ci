#!/bin/bash

. config.sh

TEST_ID=$RANDOM
echo "testId: $TEST_ID"

# ----- TEST ENVIRONMENT
PID_X=''
PID_BROWSER=''
function spawnTestEnvironment () 
{
  $CFG_X_EXE $CFG_X_ARGS &
  PID_X=$!
  sleep CFG_POLL_INTERVAL
  $CFG_BROWSER_EXE $CFG_BROWSER_ARGS
  PID_BROWSER=$!
}
function killTestEnvironment () 
{
  kill -9 $PID_BROWSER
  kill -9 $PID_X
}

# -----

function putNewJob ()
{
  JOB_DOC_URL="http://$CFG_COUCH_HOST/$CFG_COUCH_DB/$CFG_COUCH_JOB_DOCUMENT"
  echo "REQUESTING $JOB_DOC_URL"
  REV=`$CFG_CURL_EXE -s --digest --user $CFG_COUCH_USER $JOB_DOC_URL | \
    sed -e 's/.*"_rev":"\([^"]*\).*/\1/g' `
  JOB="{\"_id\":\"$CFG_COUCH_JOB_DOCUMENT\",\"testId\":$TEST_ID,\"modules\":$CFG_TEST_MODULES,\"_rev\":\"$REV\"}"
  echo $JOB
  $CFG_CURL_EXE -s -X PUT --digest --user $CFG_COUCH_USER -d $JOB $JOB_DOC_URL
}

putNewJob

#spawnTestEnvironment
