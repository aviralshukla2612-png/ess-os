import sqlite3
import os
import glob
import time
from datetime import datetime

# Find sqlite database file
db_paths = [
    "/vps/ess-os/production-data/production.db",
    "/vps/ess-os/prisma/data/production.db",
    "/vps/ess-os/prisma/dev.db",
    "/vps/ess-os/dev.db",
    "./production-data/production.db",
    "./prisma/data/production.db",
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
    print("Database file not found!")
    exit(1)

def parse_ts_to_ms(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return int(val)
    if isinstance(val, str):
        if val.isdigit():
            return int(val)
        try:
            # Handle ISO string e.g. 2026-10-09T04:11:00.000Z
            clean = val.replace("Z", "")
            if "." in clean:
                dt = datetime.strptime(clean[:23], "%Y-%m-%dT%H:%M:%S.%f")
            else:
                dt = datetime.strptime(clean, "%Y-%m-%dT%H:%M:%S")
            return int(dt.timestamp() * 1000)
        except Exception:
            pass
    return None

def format_like_original(target_ms, orig_val):
    if isinstance(orig_val, (int, float)) or (isinstance(orig_val, str) and orig_val.isdigit()):
        return int(target_ms)
    # Return ISO format
    dt = datetime.fromtimestamp(target_ms / 1000)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")

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
    print(f"\n==========================================")
    print(f"Target Employee: {name} ({email}) | EmployeeID: {emp_id}")
    print(f"==========================================")
    if not emp_id:
        print("No employee record linked.")
        continue

    # Start and end of today in ms
    now = datetime.now()
    start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0)
    end_of_day = datetime(now.year, now.month, now.day, 23, 59, 59)
    start_ms = int(start_of_day.timestamp() * 1000)
    end_ms = int(end_of_day.timestamp() * 1000)
    now_ms = int(time.time() * 1000)

    cur.execute("SELECT id, statusType, startedAt, endedAt, notes FROM EmployeeStatusEvent WHERE employeeId = ? ORDER BY startedAt ASC", (emp_id,))
    all_events = cur.fetchall()

    events = []
    for ev in all_events:
        s_ms = parse_ts_to_ms(ev[2])
        if s_ms and start_ms <= s_ms <= end_ms:
            events.append(ev)

    print(f"Today's events ({len(events)} found):")

    total_break_ms = 0
    total_work_ms = 0
    break_events = []

    for ev_id, stype, s_at, e_at, notes in events:
        s_ms = parse_ts_to_ms(s_at)
        e_ms = parse_ts_to_ms(e_at) if e_at else now_ms
        dur_ms = max(0, e_ms - s_ms)
        dur_min = round(dur_ms / 60000, 1)

        s_dt = datetime.fromtimestamp(s_ms / 1000).strftime('%H:%M:%S') if s_ms else "N/A"
        e_dt = datetime.fromtimestamp(e_ms / 1000).strftime('%H:%M:%S') if e_at else "ONGOING"
        print(f"  - [{ev_id}] {stype} ({notes or '-'}) : {s_dt} -> {e_dt} ({dur_min} min)")

        if stype != "WORKING":
            total_break_ms += dur_ms
            break_events.append((ev_id, stype, s_at, e_at, notes, dur_ms, s_ms, e_ms))
        else:
            total_work_ms += dur_ms

    print(f"\nCurrent Break: {round(total_break_ms / 60000, 1)} mins | Current Work: {round(total_work_ms / 60000, 1)} mins")

    TARGET_BREAK_MS = 20 * 60 * 1000  # Exactly 20 minutes (1,200,000 ms)
    if total_break_ms <= TARGET_BREAK_MS:
        print(f"Break time is already <= 20 mins ({round(total_break_ms / 60000, 1)} mins). Nothing to adjust.")
        continue

    excess_ms = total_break_ms - TARGET_BREAK_MS
    print(f"\nTrimming {round(excess_ms / 60000, 1)} mins of excess break to credit as WORK...")

    # Sort break events by duration descending
    break_events.sort(key=lambda x: x[5], reverse=True)
    remaining_cut = excess_ms

    for ev_id, stype, s_at, e_at, notes, dur_ms, s_ms, e_ms in break_events:
        if remaining_cut <= 0:
            break
        cut_this = min(remaining_cut, dur_ms)
        if cut_this <= 0:
            continue

        new_end_ms = e_ms - cut_this
        if e_at:
            formatted_end = format_like_original(new_end_ms, e_at)
            cur.execute("UPDATE EmployeeStatusEvent SET endedAt = ? WHERE id = ?", (formatted_end, ev_id))
            print(f"  ✓ Updated break {ev_id} endedAt -> reduced by {round(cut_this / 60000, 1)} mins")
        else:
            new_s_ms = s_ms + cut_this
            formatted_start = format_like_original(new_s_ms, s_at)
            cur.execute("UPDATE EmployeeStatusEvent SET startedAt = ? WHERE id = ?", (formatted_start, ev_id))
            print(f"  ✓ Updated ongoing break {ev_id} startedAt -> shifted forward by {round(cut_this / 60000, 1)} mins")

        # Credit work time to adjacent working event
        # 1. Look for next working event starting near old end
        next_work = None
        for w in events:
            if w[1] == "WORKING":
                w_s = parse_ts_to_ms(w[2])
                if w_s and abs(w_s - e_ms) < 120000:
                    next_work = w
                    break

        if next_work:
            orig_next_start_ms = parse_ts_to_ms(next_work[2])
            new_work_start_ms = orig_next_start_ms - cut_this
            formatted_w_start = format_like_original(new_work_start_ms, next_work[2])
            cur.execute("UPDATE EmployeeStatusEvent SET startedAt = ? WHERE id = ?", (formatted_w_start, next_work[0]))
            print(f"  ✓ Shifted subsequent WORKING event {next_work[0]} earlier by {round(cut_this / 60000, 1)} mins to credit work")
        else:
            # 2. Check previous work
            prev_work = None
            for w in events:
                if w[1] == "WORKING" and w[3]:
                    w_e = parse_ts_to_ms(w[3])
                    if w_e and abs(w_e - s_ms) < 120000:
                        prev_work = w
                        break

            if prev_work:
                orig_prev_end_ms = parse_ts_to_ms(prev_work[3])
                new_work_end_ms = orig_prev_end_ms + cut_this
                formatted_w_end = format_like_original(new_work_end_ms, prev_work[3])
                cur.execute("UPDATE EmployeeStatusEvent SET endedAt = ? WHERE id = ?", (formatted_w_end, prev_work[0]))
                print(f"  ✓ Extended previous WORKING event {prev_work[0]} later by {round(cut_this / 60000, 1)} mins to credit work")
            else:
                import uuid
                w_id = str(uuid.uuid4())
                ins_start = format_like_original(new_end_ms, s_at)
                ins_end = format_like_original(e_ms, s_at)
                cur.execute("INSERT INTO EmployeeStatusEvent (id, employeeId, statusType, startedAt, endedAt, notes) VALUES (?, ?, 'WORKING', ?, ?, 'Credited work time from break adjustment')",
                            (w_id, emp_id, ins_start, ins_end))
                print(f"  ✓ Created new WORKING event bridging {ins_start} -> {ins_end} (+{round(cut_this / 60000, 1)} mins work)")

        remaining_cut -= cut_this

    conn.commit()
    print(f"\n==========================================")
    print(f"✅ Success! Break time for {name} has been set to 20 minutes only!")
    print(f"==========================================\n")

conn.close()
