#!/bin/bash

# Install npm dependencies
npm i

# Build react before running
npm run build-react

# Run the dev script
npm run dev

# Pause and wait for user input
read -p "Press any key to continue . . ."
