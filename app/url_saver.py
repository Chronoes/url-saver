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

    save_location = os.path.expanduser(parser.get('Main', 'save_location', fallback='~/Downloads/urls.txt'))

    with open(save_location, 'a') as f:
        while True:
            received_message = get_message()
            if received_message is None:
                break
            print(received_message, file=f, flush=True)
            send_message(encode_message('pong'))

if __name__ == '__main__':
    main()
