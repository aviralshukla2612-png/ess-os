import sqlite3
import os
import glob
import time
from datetime import datetime

# Find sqlite database file
db_paths = [
    "/vps/ess-os/prisma/dev.db",
    "/vps/ess-os/dev.db",
    "/vps/ess-os/prisma/prod.db",
    "/vps/ess-os/prod.db",
    "./prisma/dev.db",
    "./dev.db",
    "./prisma/prod.db",
    "./prod.db"
]

db_file = None
for p in db_paths:
    if os.path.exists(p):
        db_file = p
        break

if not db_file:
    # search .db files
    found = glob.glob("**/*.db", recursive=True)
    if found:
        db_file = found[0]

print(f"Using database: {db_file}")
if not db_file:
    print("Database file not found!")
    exit(1)

conn = sqlite3.connect(db_file)
cur = conn.cursor()

# Find Smit
cur.execute("SELECT u.id, u.name, u.email, e.id FROM User u LEFT JOIN Employee e ON e.userId = u.id WHERE LOWER(u.name) LIKE '%smit%' OR LOWER(u.name) LIKE '%katri%' OR LOWER(u.name) LIKE '%khatri%'")
rows = cur.fetchall()

if not rows:
    print("Smit not found in User table! Listing all users:")
    cur.execute("SELECT u.id, u.name, u.email, e.id FROM User u LEFT JOIN Employee e ON e.userId = u.id")
    for r in cur.fetchall():
        print(r)
    conn.close()
    exit(1)

for u_id, name, email, emp_id in rows:
    print(f"\nFound Employee User: {name} ({email}) | EmployeeID: {emp_id}")
    if not emp_id:
        print("No employee record linked.")
        continue

    # Start and end of today in ms
    now = datetime.now()
    start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0)
    start_ms = int(start_of_day.timestamp() * 1000)
    
    cur.execute("SELECT id, statusType, startedAt, endedAt, notes FROM EmployeeStatusEvent WHERE employeeId = ? AND startedAt >= ? ORDER BY startedAt ASC", (emp_id, start_ms))
    events = cur.fetchall()
    print(f"Today's events ({len(events)} found):")
    
    break_events = []
    for ev_id, stype, s_at, e_at, notes in events:
        s_dt = datetime.fromtimestamp(s_at / 1000).strftime('%H:%M:%S') if s_at else "N/A"
        e_dt = datetime.fromtimestamp(e_at / 1000).strftime('%H:%M:%S') if e_at else "ONGOING"
        dur_min = round(((e_at if e_at else int(time.time()*1000)) - s_at) / 60000, 1)
        print(f"  - [{ev_id}] {stype} ({notes or '-'}) : {s_dt} -> {e_dt} ({dur_min} min)")
        if stype != "WORKING":
            break_events.append((ev_id, stype, s_at, e_at, notes))
            
    if not break_events:
        print("No break events recorded today.")
        continue
        
    REDUCE_MS = 20 * 60 * 1000  # 20 minutes
    remaining = REDUCE_MS
    
    for ev_id, stype, s_at, e_at, notes in reversed(break_events):
        if remaining <= 0:
            break
        end_val = e_at if e_at else int(time.time() * 1000)
        curr_dur = end_val - s_at
        reduce_this = min(remaining, curr_dur)
        if reduce_this <= 0:
            continue
            
        if e_at:
            new_ended_at = e_at - reduce_this
            cur.execute("UPDATE EmployeeStatusEvent SET endedAt = ? WHERE id = ?", (new_ended_at, ev_id))
            print(f"  ✓ Reduced break event {ev_id} endedAt by {reduce_this / 60000} mins")
        else:
            new_started_at = s_at + reduce_this
            cur.execute("UPDATE EmployeeStatusEvent SET startedAt = ? WHERE id = ?", (new_started_at, ev_id))
            print(f"  ✓ Shifted ongoing break event {ev_id} startedAt by {reduce_this / 60000} mins")
            
        # Check if next working event exists to credit work time
        cur.execute("SELECT id, startedAt FROM EmployeeStatusEvent WHERE employeeId = ? AND statusType = 'WORKING' AND abs(startedAt - ?) < 60000", (emp_id, end_val))
        next_work = cur.fetchone()
        if next_work:
            cur.execute("UPDATE EmployeeStatusEvent SET startedAt = ? WHERE id = ?", (next_work[1] - reduce_this, next_work[0]))
            print(f"  ✓ Extended next working event {next_work[0]} earlier by {reduce_this / 60000} mins")
            
        remaining -= reduce_this
        
    conn.commit()
    print(f"\n✅ Successfully reduced 20 minutes from break time for {name}!")

conn.close()
