#!/bin/bash

# Define the potential source directories
darwin_source="$HOME/Library/Preferences/TalOS"
linux_source_var="/var/local/TalOS"
linux_source_home="$HOME/.local/share/TalOS"

# Determine the source directory based on the operating system
if [ "$(uname)" == "Darwin" ]; then
    source_dir=$darwin_source
elif [ -d $linux_source_var ]; then
    source_dir=$linux_source_var
else
    source_dir=$linux_source_home
fi

# Specify the name of the Docker container
container_name="talos-reborn-container"

# Check if the source directory exists and is not empty
if [ -d "$source_dir" ] && [ "$(ls -A $source_dir)" ]; then
    echo "Found data directory at $source_dir, moving contents to Docker volume..."

    # Copy the data to the container's volume
    docker cp "$source_dir/." "$container_name:/var/local/TalOS/."

    if [ $? -eq 0 ]; then
        echo "Data successfully moved to Docker volume."
    else
        echo "Error moving data to Docker volume."
    fi
else
    echo "No data directory found or directory is empty."
fi
