#!/bin/bash
echo "==================================================="
echo "Starting Photo Gallery Server..."
echo "Please leave this window open while using the gallery!"
echo "==================================================="

# Navigate to the directory where this script is located
cd "$(dirname "$0")" || exit

# Check if Node.js / npm is installed
if ! command -v npm &> /dev/null; then
    echo ""
    echo "[ERROR] Node.js is not installed on your computer!"
    echo "This application requires Node.js to run the local server."
    echo "Please download and install it for free from: https://nodejs.org/"
    echo ""
    echo "After installing, run this script again to start the gallery."
    echo ""
    read -p "Press any key to exit..." -n1 -s
    echo ""
    exit 1
fi

# Automatically pull the latest code from GitHub
echo "Checking for updates..."
git pull || true
echo ""

# Check if dependencies are installed or updated
echo "Ensuring required dependencies are installed..."
npm install --no-audit --no-fund
echo ""

# Start the server
echo "Starting the server... You can now open your browser to http://localhost:3000"
echo ""
node server.js
