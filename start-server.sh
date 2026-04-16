#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_OPTIONS="--max-old-space-size=512" node .next/standalone/server.js -H 0.0.0.0 -p 3000 2>&1
  echo "[$(date)] Server stopped, restarting in 2s..."
  sleep 2
done
