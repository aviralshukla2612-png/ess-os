import sqlite3
import os
import glob
import time
from datetime import datetime

# Find sqlite database file
db_paths = [
    "/vps/ess-os/prisma/dev.db",
    "/vps/ess-os/dev.db",
    "/vps/ess-os/production-data/production.db",
    "/vps/ess-os/prisma/prod.db",
    "./prisma/dev.db",
    "./dev.db",
    "./prisma/prod.db"
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
    print("Database file not found!")
    exit(1)

conn = sqlite3.connect(db_file)
cur = conn.cursor()

# Find Aviral Shukla
cur.execute("SELECT u.id, u.name, u.email, e.id FROM User u LEFT JOIN Employee e ON e.userId = u.id WHERE LOWER(u.name) LIKE '%aviral%' OR LOWER(u.name) LIKE '%shukla%' OR LOWER(u.email) LIKE '%aviral%'")
rows = cur.fetchall()

if not rows:
    print("Aviral Shukla not found in User table! Listing all users:")
    cur.execute("SELECT u.id, u.name, u.email, e.id FROM User u LEFT JOIN Employee e ON e.userId = u.id")
    for r in cur.fetchall():
        print(r)
    conn.close()
    exit(1)

for u_id, name, email, emp_id in rows:
    print(f"\nFound Employee: {name} ({email}) | EmployeeID: {emp_id}")
    if not emp_id:
        print("No employee record linked.")
        continue

    # Start and end of today in ms
    now = datetime.now()
    start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0)
    start_ms = int(start_of_day.timestamp() * 1000)
    now_ms = int(time.time() * 1000)

    cur.execute("SELECT id, statusType, startedAt, endedAt, notes FROM EmployeeStatusEvent WHERE employeeId = ? AND startedAt >= ? ORDER BY startedAt ASC", (emp_id, start_ms))
    events = cur.fetchall()
    print(f"Today's events ({len(events)} found):")

    total_break_ms = 0
    total_work_ms = 0
    break_events = []

    for ev_id, stype, s_at, e_at, notes in events:
        s_dt = datetime.fromtimestamp(s_at / 1000).strftime('%H:%M:%S') if s_at else "N/A"
        e_dt = datetime.fromtimestamp(e_at / 1000).strftime('%H:%M:%S') if e_at else "ONGOING"
        dur_ms = max(0, (e_at if e_at else now_ms) - s_at)
        dur_min = round(dur_ms / 60000, 1)
        print(f"  - [{ev_id}] {stype} ({notes or '-'}) : {s_dt} -> {e_dt} ({dur_min} min)")
        if stype != "WORKING":
            total_break_ms += dur_ms
            break_events.append((ev_id, stype, s_at, e_at, notes, dur_ms))
        else:
            total_work_ms += dur_ms

    print(f"\nCurrent Break: {round(total_break_ms / 60000, 1)} mins | Current Work: {round(total_work_ms / 60000, 1)} mins")

    TARGET_BREAK_MS = 20 * 60 * 1000  # Exactly 20 minutes
    if total_break_ms <= TARGET_BREAK_MS:
        print(f"Break time is already <= 20 mins ({round(total_break_ms / 60000, 1)} mins). Nothing to adjust.")
        continue

    excess_ms = total_break_ms - TARGET_BREAK_MS
    print(f"Trimming {round(excess_ms / 60000, 1)} mins from break time so total break becomes 20 mins...")

    # Sort break events by duration descending
    break_events.sort(key=lambda x: x[5], reverse=True)
    remaining_cut = excess_ms

    for ev_id, stype, s_at, e_at, notes, dur_ms in break_events:
        if remaining_cut <= 0:
            break
        end_val = e_at if e_at else now_ms
        cut_this = min(remaining_cut, dur_ms)
        if cut_this <= 0:
            continue

        new_end = end_val - cut_this
        if e_at:
            cur.execute("UPDATE EmployeeStatusEvent SET endedAt = ? WHERE id = ?", (new_end, ev_id))
            print(f"  ✓ Updated break {ev_id} endedAt -> reduced by {round(cut_this / 60000, 1)} mins")
        else:
            new_s_at = s_at + cut_this
            cur.execute("UPDATE EmployeeStatusEvent SET startedAt = ? WHERE id = ?", (new_s_at, ev_id))
            print(f"  ✓ Updated ongoing break {ev_id} startedAt -> shifted forward by {round(cut_this / 60000, 1)} mins")

        # Credit work time to adjacent working event
        cur.execute("SELECT id, startedAt FROM EmployeeStatusEvent WHERE employeeId = ? AND statusType = 'WORKING' AND abs(startedAt - ?) < 120000", (emp_id, end_val))
        next_work = cur.fetchone()
        if next_work:
            cur.execute("UPDATE EmployeeStatusEvent SET startedAt = ? WHERE id = ?", (next_work[1] - cut_this, next_work[0]))
            print(f"  ✓ Shifted subsequent WORKING event {next_work[0]} earlier by {round(cut_this / 60000, 1)} mins to credit work")
        else:
            # Check previous work
            cur.execute("SELECT id, endedAt FROM EmployeeStatusEvent WHERE employeeId = ? AND statusType = 'WORKING' AND abs(endedAt - ?) < 120000", (emp_id, s_at))
            prev_work = cur.fetchone()
            if prev_work and prev_work[1]:
                cur.execute("UPDATE EmployeeStatusEvent SET endedAt = ? WHERE id = ?", (prev_work[1] + cut_this, prev_work[0]))
                print(f"  ✓ Extended previous WORKING event {prev_work[0]} later by {round(cut_this / 60000, 1)} mins to credit work")
            else:
                import uuid
                w_id = str(uuid.uuid4())
                cur.execute("INSERT INTO EmployeeStatusEvent (id, employeeId, statusType, startedAt, endedAt, notes) VALUES (?, ?, 'WORKING', ?, ?, 'Credited work time from break adjustment')",
                            (w_id, emp_id, new_end, end_val))
                print(f"  ✓ Created new WORKING event bridging {new_end} -> {end_val} (+{round(cut_this / 60000, 1)} mins work)")

        remaining_cut -= cut_this

    conn.commit()
    print(f"\n✅ Done! Break time for {name} has been set to 20 minutes only!")

conn.close()
