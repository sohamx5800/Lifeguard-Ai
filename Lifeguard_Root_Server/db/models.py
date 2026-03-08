import sqlite3

conn = sqlite3.connect("lifeguard.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS accidents(
id INTEGER PRIMARY KEY AUTOINCREMENT,
car_id TEXT,
lat REAL,
lon REAL,
impact TEXT,
passengers INTEGER,
severity TEXT,
timestamp TEXT,
status TEXT
)
""")

conn.commit()


def log_accident(data):

    cursor.execute(
        """
        INSERT INTO accidents
        (car_id,lat,lon,impact,passengers,severity,timestamp,status)
        VALUES (?,?,?,?,?,?,?,?)
        """,
        (
            data["car_id"],
            data["lat"],
            data["lon"],
            data["impact"],
            data["passengers"],
            data["severity"],
            data["timestamp"],
            "DISPATCHED"
        )
    )

    conn.commit()


def get_all_accidents():

    cursor.execute("SELECT * FROM accidents ORDER BY id DESC")

    rows = cursor.fetchall()

    return rows