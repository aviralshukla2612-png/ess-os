import sqlite3
import os
import glob
from datetime import datetime

db_paths = [
    "/vps/ess-os/production-data/production.db",
    "/vps/ess-os/prisma/dev.db",
    "/vps/ess-os/dev.db",
    "/vps/ess-os/prisma/prod.db",
    "./prisma/dev.db"
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
conn = sqlite3.connect(db_file)
cur = conn.cursor()

# Find all past unclosed break events (started before today and endedAt IS NULL)
# Today start in ms ~ 1790100000000
cur.execute("""
    SELECT id, employeeId, statusType, startedAt, endedAt
    FROM EmployeeStatusEvent
    WHERE statusType != 'WORKING' AND endedAt IS NULL AND startedAt < 1790100000000
""")

dangling_breaks = cur.fetchall()
print(f"Found {len(dangling_breaks)} past unclosed break events.")

fixed_count = 0
for ev_id, emp_id, stype, s_at, e_at in dangling_breaks:
    if isinstance(s_at, (int, float)):
        closed_at = int(s_at) + (30 * 60 * 1000) # 30 mins
    else:
        closed_at = s_at # fallback
        
    cur.execute("""
        UPDATE EmployeeStatusEvent
        SET endedAt = ?
        WHERE id = ?
    """, (closed_at, ev_id))
    fixed_count += 1

conn.commit()
conn.close()

print(f"✅ Successfully closed {fixed_count} past dangling break events! Refresh your browser.")
