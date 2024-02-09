#!/bin/bash

echo "Building Docker image..."
docker build -t talos-reborn .
if [ $? -ne 0 ]; then
    echo "Error building Docker image."
    exit 1
fi

echo "Stopping existing Docker container (if any)..."
docker stop talos-reborn-container 2>/dev/null || true

echo "Removing existing Docker container (if any)..."
docker rm talos-reborn-container 2>/dev/null || true

echo "Running container from the Docker image..."
docker run -d -p 3003:3003 -v talos-reborn:/var/local --name talos-reborn-container talos-reborn:latest
if [ $? -ne 0 ]; then
    echo "Error running Docker container."
    exit 1
fi

echo "Docker container is running, bound to port 3003."
