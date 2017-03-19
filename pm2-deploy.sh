#!/bin/bash

# Run this as root. The app will be daemonized to run as the user "fileup", or whatever defined in $USER

# CPUS=0 scales automatically
$USER = fileup
$NAME = fileup
$CPUS = 0

su - $USER -c "npm install && npm run build";

pm2 start build/index.js --name="$NAME" -u $USER -i $CPUS

pm2 save