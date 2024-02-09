@echo off
SET scriptPath=%~dp0migrate-to-docker.ps1
PowerShell -ExecutionPolicy Bypass -Command "& '%scriptPath%'"
echo Script execution completed.
pause