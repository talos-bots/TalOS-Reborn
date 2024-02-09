@echo off
echo Building Docker image...
docker build -t talos-reborn .
if %ERRORLEVEL% neq 0 (
    echo Error building Docker image.
    pause
)

echo Running container from the Docker image...
docker run -d -p 3003:3003 -v talos-reborn:/var/local --name talos-reborn-container talos-reborn:latest
if %ERRORLEVEL% neq 0 (
    echo Error running Docker container.
    pause
)

echo Docker container is running, bound to port 3003.
pause