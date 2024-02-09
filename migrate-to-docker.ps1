# Define the TalOS data directory on Windows
$sourceDir = Join-Path $env:APPDATA "TalOS"

# Specify the Docker volume name
$volumeName = "talos-reborn"

# Define the temporary container name
$tempContainerName = "temp-data-mover"

# Define the target directory inside the container/volume
$targetDirInVolume = "/var/local/TalOS"

# Check if the TalOS directory exists and is not empty
if (Test-Path $sourceDir) {
    if ((Get-ChildItem $sourceDir).Count -gt 0) {
        Write-Host "Found TalOS data directory at $sourceDir, moving contents to Docker volume..."
        # Create a temporary container with the volume mounted to move the data
        # This uses an Alpine Linux container due to its small size
        docker run --rm -v ${volumeName}:/var/local --name $tempContainerName -d alpine:latest sleep 3600

        # Ensure the target directory exists in the volume
        docker exec $tempContainerName mkdir -p $targetDirInVolume

        # Copy the data to the container, which effectively copies it to the volume
        docker cp $sourceDir/. "${tempContainerName}:${targetDirInVolume}/."

        # Stop the temporary container
        docker stop $tempContainerName

        Write-Host "Data successfully moved to Docker volume."
    } else {
        Write-Host "TalOS data directory is empty."
    }
} else {
    Write-Host "No TalOS data directory found."
}