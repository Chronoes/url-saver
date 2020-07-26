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
    found = False
    name_match = None
    for name, path in paths:
        with open(path) as f:
            for line in f:
                if line.strip() == url:
                    found = True
                    name_match = name
                    break
        if found:
            break

    return (found, name_match)


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
                found, _name_match = find_match(url, parser.items('Locations'))
                response['found'] = found
            except InvalidURLException:
                response['found'] = False
            response['tabId'] = received_message['tabId']
            response['url'] = url
        elif action == 'remove':
            try:
                url = get_canonical_url(received_message['url'])
                found, name_match = find_match(url, parser.items('Locations'))
            except InvalidURLException:
                found = False

            response['success'] = False
            if found:
                path = parser.get('Locations', name_match)
                temp_path = os.path.join(gettempdir(), 'url-saver', name_match)

                if not os.path.isdir(temp_path):
                    os.makedirs(temp_path)

                temp_filepath = os.path.join(temp_path, os.path.basename(path))
                with open(path) as f, open(temp_filepath, 'w') as temp_file:
                    for line in f:
                        if line.strip() != url:
                            temp_file.write(line)

                os.remove(path)
                shutil.move(temp_filepath, path)

                response['success'] = True

            response['tabId'] = received_message['tabId']
            response['url'] = url

        send_message(encode_message(response))

    print('Closing url_saver', file=sys.stderr)


if __name__ == '__main__':
    main()
