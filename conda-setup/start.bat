@echo off

call runtime git pull

start cmd /k "npm install && npm run dev"