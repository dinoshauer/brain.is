#!/bin/bash

node_modules/.bin/concurrently \
    --kill-others \
    "yarn run wait-5 && yarn run api" \
    "docker-compose up"
