#!/bin/sh

# Request root access
[ "$UID" -eq 0 ] || exec sudo "$0" "$@"

DEPLOY_PATH=/usr/local/share/url-saver
mkdir -p "$DEPLOY_PATH"
cp -r app/* "$DEPLOY_PATH"

# Deploy to Firefox
mkdir -p /usr/lib/mozilla/native-messaging-hosts /usr/lib64/mozilla/native-messaging-hosts
cp app/url_saver.json /usr/lib/mozilla/native-messaging-hosts
cp app/url_saver.json /usr/lib64/mozilla/native-messaging-hosts
