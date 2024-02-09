#!/bin/bash

echo "Stopping existing Docker container..."
docker stop talos-reborn-container
if [ $? -ne 0 ]; then
    echo "Error stopping Docker container."
    read -p "Press enter to continue"
fi

echo "Removing existing Docker container..."
docker rm talos-reborn-container
if [ $? -ne 0 ]; then
    echo "Error removing Docker container."
    read -p "Press enter to continue"
fi

echo "Building new Docker image..."
docker build -t talos-reborn:latest .
if [ $? -ne 0 ]; then
    echo "Error building Docker image."
    read -p "Press enter to continue"
fi

echo "Running new container from the Docker image..."
docker run -d -p 3003:3003 -v talos-reborn:/var/local --name talos-reborn-container talos-reborn:latest
if [ $? -ne 0 ]; then
    echo "Error running Docker container."
    read -p "Press enter to continue"
else
    echo "Docker container has been updated and is running, bound to port 3003."
    read -p "Press enter to continue"
fi
