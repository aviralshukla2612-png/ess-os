import sqlite3
import os
import glob
import time
from datetime import datetime

db_paths = [
    "/vps/ess-os/prisma/dev.db",
    "/vps/ess-os/dev.db",
    "/vps/ess-os/prisma/prod.db",
    "/vps/ess-os/prod.db",
    "./prisma/dev.db",
    "./dev.db"
]

db_file = None
for p in db_paths:
    if os.path.exists(p):
        db_file = p
        break

if not db_file:
    found = glob.glob("**/*.db", recursive=True)
    if found:
        db_file = found[0]

print(f"Using database: {db_file}")
if not db_file:
    print("Database not found!")
    exit(1)

conn = sqlite3.connect(db_file)
cur = conn.cursor()

print("--- USERS ---")
cur.execute("SELECT u.id, u.name, u.email, e.id, e.employeeIdCode FROM User u LEFT JOIN Employee e ON e.userId = u.id")
users = cur.fetchall()
for u in users:
    print(u)

print("\n--- ATTENDANCES FOR LAST 7 DAYS ---")
cur.execute("""
    SELECT a.id, u.name, e.employeeIdCode, a.date, a.punchIn, a.punchOut, a.status, a.totalMinutes, a.punchOutReason, a.punchOutRequestStatus
    FROM Attendance a
    JOIN Employee e ON a.employeeId = e.id
    JOIN User u ON e.userId = u.id
    ORDER BY a.date DESC
    LIMIT 30
""")
for r in cur.fetchall():
    print(r)

conn.close()
