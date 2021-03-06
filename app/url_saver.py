#!/usr/bin/env python

import sys
import json
import struct
import configparser
import os
import os.path
import shutil
import platform

from urllib.parse import urlparse, parse_qs
from tempfile import gettempdir

class InvalidURLException(Exception): pass


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
    encoded_content = json.dumps(message_content).encode('utf-8')
    encoded_length = struct.pack('@I', len(encoded_content))
    return (encoded_length, encoded_content)

# Send an encoded message to stdout
def send_message(encoded_message):
    length, content = encoded_message
    sys.stdout.buffer.write(length)
    sys.stdout.buffer.write(content)
    sys.stdout.buffer.flush()


def gelbooru_canonical_url(url):
    parsed_url = urlparse(url)
    qry = parse_qs(parsed_url.query)
    if 'id' not in qry or len(qry['id']) == 0:
        raise InvalidURLException('Missing id in query')
    return 'https://gelbooru.com/index.php?page=post&s=view&id=' + qry['id'].pop()


def get_canonical_url(url):
    if url.find('gelbooru.com') != -1:
        return gelbooru_canonical_url(url)
    return url


def find_match(url, paths):
    for name, path in paths:
        with open(path) as f:
            for nr, line in enumerate(f):
                if line.strip() == url:
                    return (True, name, nr)

    return (False, None, -1)


def main():
    parser = configparser.ConfigParser()
    user_config = '~/.config/url-saver/url_saver.ini'
    if platform.system() == 'Windows':
        user_config = os.path.expandvars('%APPDATA%/url-saver/url_saver.ini')
    parser.read([os.path.join(os.path.dirname(sys.argv[0]), 'url_saver.ini'), os.path.expanduser(user_config)])

    # Expand config paths and create empty files
    for key, value in parser.items('Locations'):
        path = os.path.expanduser(value)
        parser.set('Locations', key, path)
        if not os.path.isfile(path):
            open(path, 'w').close()

    print('Starting up url_saver', file=sys.stderr)
    while True:
        received_message = get_message()
        if received_message is None:
            break
        elif received_message == 'reload':
            main()
            break

        action = received_message.get('action', 'add')
        response = {'action': action}

        if action == 'add':
            url_type = received_message.get('type', 'default')

            with open(parser.get('Locations', url_type, fallback=parser.get('Locations', 'default')), 'a') as f:
                try:
                    print(get_canonical_url(received_message['url']), file=f)
                except InvalidURLException:
                    pass

        elif action == 'check':
            try:
                url = get_canonical_url(received_message['url'])
                response['found'] = find_match(url, parser.items('Locations'))[0]
            except InvalidURLException:
                response['found'] = False
            response['tabId'] = received_message['tabId']
            response['url'] = received_message['url']
        elif action == 'remove':
            try:
                url = get_canonical_url(received_message['url'])
                found, name_match, line_nr = find_match(url, parser.items('Locations'))
            except InvalidURLException:
                found = False

            response['success'] = False
            if found:
                path = parser.get('Locations', name_match)
                with open(path, 'r+') as f:
                    lines = f.readlines()
                    lines.pop(line_nr)
                    f.seek(0)
                    f.truncate()
                    f.writelines(lines)

                response['success'] = True

            response['tabId'] = received_message['tabId']
            response['url'] = received_message['url']

        send_message(encode_message(response))

    print('Closing url_saver', file=sys.stderr)


if __name__ == '__main__':
    main()
