#!/bin/bash

echo "Running container from the Docker image..."
docker run -d -p 3003:3003 -v talos-reborn:/var/local --name talos-reborn-container talos-reborn:latest

if [ $? -ne 0 ]; then
    echo "Error running Docker container."
    read -p "Press enter to continue"
else
    echo "Docker container is running, bound to port 3003."
    read -p "Press enter to continue"
fi
