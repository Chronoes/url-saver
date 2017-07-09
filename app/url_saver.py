#!/usr/bin/env python

import sys
import json
import struct
import configparser
import os.path

def get_message():
    rawLength = sys.stdin.buffer.read(4)
    if len(rawLength) == 0:
        return
    messageLength = struct.unpack('@I', rawLength)[0]
    message = sys.stdin.buffer.read(messageLength).decode('utf-8')
    return json.loads(message)

# Encode a message for transmission,
# given its content.
def encode_message(messageContent):
    encodedContent = json.dumps(messageContent).encode('utf-8')
    encodedLength = struct.pack('@I', len(encodedContent))
    return (encodedLength, encodedContent)

# Send an encoded message to stdout
def send_message(encodedMessage):
    length, content = encodedMessage
    sys.stdout.buffer.write(length)
    sys.stdout.buffer.write(content)
    sys.stdout.buffer.flush()


def main():
    parser = configparser.ConfigParser()
    parser.read([os.path.join(os.path.dirname(sys.argv[0]), 'url_saver.ini'), os.path.expanduser('~/.config/url-saver/url_saver.ini')])

    fallback = '~/Downloads/urls.txt'
    open_files = {}
    default_location = parser.get('Main', 'default_location', fallback=fallback)

    while True:
        received_message = get_message()
        if received_message is None:
            break
        elif received_message == 'reload':
            for file in open_files.values():
                file.close()
            main()
            break
        url_type = received_message.get('type', 'default')
        if url_type not in open_files:
            open_files[url_type] = open(os.path.expanduser(parser.get('Locations', url_type, fallback=default_location)), 'a')

        print(received_message['url'], file=open_files[url_type], flush=True)
        send_message(encode_message('pong'))

    for file in open_files.values():
        file.close()

if __name__ == '__main__':
    main()
