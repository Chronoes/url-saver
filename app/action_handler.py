import datetime
import sqlite3
from typing import Optional
from urllib.parse import urlparse, parse_qs

from database import ImageViewedDb


class InvalidURLException(Exception): pass


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


def find_match(url, path):
    with open(path) as f:
        for nr, line in enumerate(f):
            line = line.strip()
            if url in line:
                name = line.split(' ', maxsplit=1)[0]
                return (True, name, nr)

    return (False, None, -1)


def has_active_series(path):
    stack = []
    with open(path) as f:
        for line in f:
            if line.startswith('series'):
                stack.append('series')
            elif line.startswith('end series'):
                if stack and stack[-1] == 'series':
                    stack.pop()
    return stack and stack[-1] == 'series'


class ActionHandler:
    def __init__(self, filepath: str, sqlite_file: str) -> None:
        self.filepath = filepath
        self.db = ImageViewedDb(sqlite_file)

    def add(self, received_message: dict, response: dict) -> dict:
        url_type = received_message.get('type', 'default')
        response['type'] = url_type

        is_series = received_message.get('series', False)
        response['series'] = is_series
        is_active_series = has_active_series(self.filepath)
        response['activeSeries'] = is_active_series

        with open(self.filepath , 'a') as f:
            # If there's an active series but this URL is not part of a series
            if is_active_series:
                if not is_series:
                    print('end series', file=f)
            elif is_series:
                print('series', file=f)

            try:
                url = get_canonical_url(received_message['url'])
                print(f'{url_type} {url}', file=f)
                response['url'] = url
            except InvalidURLException:
                response['invalid'] = True
        return response

    def is_added(self, received_message: dict, response: dict) -> dict:
        try:
            url = get_canonical_url(received_message['url'])
            found, name_match, _ = find_match(url, self.filepath)
            response['found'] = found
            response['type'] = name_match
        except InvalidURLException:
            response['found'] = False
        response['url'] = received_message['url']
        return response


    def remove(self, received_message: dict, response: dict) -> dict:
        try:
            url = get_canonical_url(received_message['url'])
            found, name_match, line_nr = find_match(url, self.filepath)
        except InvalidURLException:
            found = False
            response['invalid'] = True

        response['success'] = False
        if found:
            response['type'] = name_match
            with open(self.filepath, 'r+') as f:
                lines = f.readlines()
                lines.pop(line_nr)
                f.seek(0)
                f.truncate()
                f.writelines(lines)

            response['success'] = True

        response['url'] = received_message['url']

    def start_series(self, received_message: dict, response: dict) -> dict:
        url_type = received_message.get('type', 'default')
        response['type'] = url_type

        if not has_active_series(self.filepath):
            with open(self.filepath, 'a') as f:
                print('series', file=f)

    def end_series(self, received_message: dict, response: dict) -> dict:
        url_type = received_message.get('type', 'default')
        response['type'] = url_type

        if has_active_series(self.filepath):
            with open(self.filepath, 'a') as f:
                print('end series', file=f)

    def _get_viewed_item(self, cursor: sqlite3.Cursor, item: dict) -> Optional[sqlite3.Row]:
        cursor.execute('SELECT source, id, page FROM viewed WHERE source = ? AND id = ?', (item['source'], item['id']))
        return cursor.fetchone()

    def view(self, received_message: dict, response: dict) -> dict:
        item = received_message['item']
        now_dt = datetime.datetime.now()
        now_dt.microsecond = 0
        with self.db as cursor:
            db_item = self._get_viewed_item(cursor, item)
            if db_item:
                response['exists'] = True
                if db_item[2] < item['page']:
                    cursor.execute('UPDATE viewed SET date_modified = ?, page = ? WHERE source = ? AND id = ?',
                        (now_dt.isoformat(), item['page'], item['source'], item['id'])
                    )
            else:
                response['exists'] = False
                cursor.execute('INSERT INTO viewed(source, id, page, date_created, date_modified) VALUES (?,?,?,?,?)',
                    (item['source'], item['id'], item['page'], now_dt.isoformat(), now_dt.isoformat())
                )

        response['item'] = item
        return response

    def is_viewed(self, received_message: dict, response: dict) -> dict:
        ids = set(received_message['ids'])
        placeholders = ','.join('?' for _ in ids)
        with self.db as cursor:
            cursor.execute(f'SELECT id FROM viewed WHERE source = ? AND id IN ({placeholders})',
                [received_message['source'], *ids]
            )

            viewed = []
            for row in cursor.fetchall():
                viewed.append(row[0])

        response['source'] = received_message['source']
        response['viewed'] = viewed
        return response
