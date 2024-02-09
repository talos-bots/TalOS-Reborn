@echo off
echo Stopping existing Docker container...
docker stop talos-reborn-container
if %ERRORLEVEL% neq 0 (
    echo Error stopping Docker container.
    pause
)

echo Removing existing Docker container...
docker rm talos-reborn-container
if %ERRORLEVEL% neq 0 (
    echo Error removing Docker container.
    pause
)

echo Building new Docker image...
docker build -t talos-reborn:latest .
if %ERRORLEVEL% neq 0 (
    echo Error building Docker image.
    pause
)

echo Running new container from the Docker image...
docker run -d -p 3003:3003 -v talos-reborn:/var/local --name talos-reborn-container talos-reborn:latest
if %ERRORLEVEL% neq 0 (
    echo Error running Docker container.
    pause
)

echo Docker container has been updated and is running, bound to port 3003.
pause
