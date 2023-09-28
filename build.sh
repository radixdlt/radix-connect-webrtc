#!/bin/bash

set -e

# Build the docker image
docker build -t radix-connect-webrtc:latest .