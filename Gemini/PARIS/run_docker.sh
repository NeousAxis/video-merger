#!/bin/bash

# Build the Docker image
docker build -t paris-bot-image .

# Run the Docker container
docker run --rm paris-bot-image