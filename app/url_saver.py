#!/usr/bin/env python

import sys
import json
import struct
import configparser
import os
import os.path
import platform

from action_handler import ActionHandler

version_info = (1, 8)
version = '.'.join(map(str, version_info))


def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        return
    message_length = struct.unpack('@I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

# Encode a message for transmission,
# given its content.
def encode_message(message_content):
    encoded_content = json.dumps(message_content, separators=(',', ':')).encode('utf-8')
    encoded_length = struct.pack('@I', len(encoded_content))
    return (encoded_length, encoded_content)

# Send an encoded message to stdout
def send_message(encoded_message):
    length, content = encoded_message
    sys.stdout.buffer.write(length)
    sys.stdout.buffer.write(content)
    sys.stdout.buffer.flush()



def main():
    parser = configparser.ConfigParser()
    user_config = '~/.config/url-saver/url_saver.ini'
    if platform.system() == 'Windows':
        user_config = os.path.expandvars('%APPDATA%/url-saver/url_saver.ini')
    parser.read([os.path.join(os.path.dirname(sys.argv[0]), 'url_saver.ini'), os.path.expanduser(user_config)])

    # Expand config paths and create empty files
    for key in ['urlFile', 'database']:
        value = parser.get('Main', key)
        path = os.path.expanduser(value)
        parser.set('Main', key, path)
        if not os.path.isfile(path):
            open(path, 'w').close()

    location_keys = [k.strip() for k in parser.get('Main', 'urlTypes').split(',')]
    print('Starting up url_saver', file=sys.stderr)

    send_message(encode_message({'action': 'startup', 'version': version, 'types': location_keys}))

    action_handler = ActionHandler(parser.get('Main', 'urlFile'), parser.get('Main', 'database'))
    while True:
        received_message = get_message()
        if received_message is None:
            break
        elif received_message == 'reload':
            main()
            break

        action = received_message.get('action', '')
        response = {'action': action, 'version': version, 'tabId': received_message.get('tabId')}

        if action == 'add':
            action_handler.add(received_message, response)
        elif action == 'is added':
            action_handler.is_added(received_message, response)
        elif action == 'remove':
            action_handler.remove(received_message, response)
        elif action == 'series':
            action_handler.start_series(received_message, response)
        elif action == 'end series':
            action_handler.end_series(received_message, response)
        elif action == 'view':
            action_handler.view(received_message, response)
        elif action == 'is viewed':
            action_handler.is_viewed(received_message, response)

        send_message(encode_message(response))

    print('Closing url_saver', file=sys.stderr)


if __name__ == '__main__':
    main()
