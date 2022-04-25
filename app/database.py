import sqlite3
import sys

class ImageViewedDb:
    def __init__(self, filepath: str) -> None:
        self.conn = sqlite3.connect(filepath)
        self.cursor = None

    def init_schema(self):
        cursor = self.conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS viewed(
            source text NOT NULL,
            id text NOT NULL,
            page int,
            date_created text,
            date_modified text,
            UNIQUE(source, id)
        )""")

    def __enter__(self):
        self.cursor = self.conn.cursor()
        return self.cursor

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Auto-commit on exit, normally have to call manually
        self.cursor.connection.commit()
        self.cursor.close()


if __name__ == '__main__':
    db = ImageViewedDb(sys.argv[1])
    db.init_schema()
    print('Schema initialized')
