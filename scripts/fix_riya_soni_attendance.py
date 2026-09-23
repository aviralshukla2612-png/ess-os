import sqlite3
import os
import glob
import time
from datetime import datetime, timedelta

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
    print("Database file not found!")
    exit(1)

conn = sqlite3.connect(db_file)
cur = conn.cursor()

# Find Riya Soni
cur.execute("SELECT u.id, u.name, u.email, e.id, e.employeeIdCode FROM User u LEFT JOIN Employee e ON e.userId = u.id WHERE LOWER(u.name) LIKE '%riya%' OR LOWER(u.name) LIKE '%soni%'")
rows = cur.fetchall()

if not rows:
    print("Riya Soni not found! Listing all users:")
    cur.execute("SELECT u.id, u.name, u.email, e.id FROM User u LEFT JOIN Employee e ON e.userId = u.id")
    for r in cur.fetchall():
        print(r)
    conn.close()
    exit(1)

for u_id, name, email, emp_id, emp_code in rows:
    print(f"\n==========================================")
    print(f"Target: {name} ({email}) | Employee ID: {emp_id} | Code: {emp_code}")
    print(f"==========================================")
    if not emp_id:
        print("No employee record linked.")
        continue

    # 1. Fetch recent attendances
    cur.execute("""
        SELECT id, date, punchIn, punchOut, totalMinutes, status, punchOutRequestStatus, punchOutReason
        FROM Attendance
        WHERE employeeId = ?
        ORDER BY date DESC
        LIMIT 15
    """, (emp_id,))
    atts = cur.fetchall()
    print("Recent Attendance Records in DB:")
    for a in atts:
        print(f"  [ID: {a[0]}] Date: {a[1]} | In: {a[2]} | Out: {a[3]} | Mins: {a[4]} | Status: {a[5]}")

    # Inspect the date formats used in SQLite
    # They could be ISO strings (e.g. '2026-09-22T04:00:00.000Z' or '2026-09-22 04:00:00' or ms timestamp)
    
    # We want yesterday: 2026-09-22
    # In IST: Punch In ~ 09:30 AM (04:00:00 UTC), Punch Out ~ 06:30 PM (18:30:00 IST -> 13:00:00 UTC)
    # 6:00 - 6:30 PM is 18:30 IST.
    
    # Look for attendance on 2026-09-22
    cur.execute("""
        SELECT id, date, punchIn, punchOut, totalMinutes, status
        FROM Attendance
        WHERE employeeId = ? AND (date LIKE '%2026-09-22%' OR punchIn LIKE '%2026-09-22%')
    """, (emp_id,))
    matched = cur.fetchall()

    if matched:
        for att_id, a_date, p_in, p_out, total_mins, status in matched:
            print(f"\nFound yesterday's record: ID={att_id}, punchIn={p_in}, current punchOut={p_out}")
            
            # Format punchOut matching the format of punchIn
            # Check if format is ISO string with 'T' and 'Z' or standard string
            if isinstance(p_in, str) and 'T' in p_in:
                # E.g. '2026-09-22T04:00:00.000Z' (which is 09:30 IST) -> Punch out at 18:30 IST is 13:00:00 UTC
                new_punch_out = "2026-09-22T13:00:00.000Z"
            elif isinstance(p_in, (int, float)):
                # timestamp in ms
                # 2026-09-22 18:30:00 IST = 2026-09-22 13:00:00 UTC
                new_punch_out = int(datetime(2026, 9, 22, 13, 0, 0).timestamp() * 1000)
            else:
                new_punch_out = "2026-09-22 13:00:00"

            # Calculate total minutes
            # Assuming standard ~9 hours (540 mins) or 8h 30m - 9h
            calc_minutes = 540  # 9 hours (09:30 AM to 06:30 PM = 9 hours)
            
            cur.execute("""
                UPDATE Attendance
                SET punchOut = ?, totalMinutes = ?, status = 'PRESENT', punchOutReason = NULL, punchOutRequestStatus = NULL
                WHERE id = ?
            """, (new_punch_out, calc_minutes, att_id))
            print(f"  ✓ Updated Attendance record {att_id}: punchOut set to 6:30 PM (18:30 IST), totalMinutes = {calc_minutes}")
    else:
        print("\nNo attendance found for 2026-09-22. Creating full record for yesterday...")
        import uuid
        new_id = str(uuid.uuid4())
        date_val = "2026-09-22T00:00:00.000Z"
        punch_in_val = "2026-09-22T04:00:00.000Z"    # 09:30 AM IST
        punch_out_val = "2026-09-22T13:00:00.000Z"   # 06:30 PM IST
        total_minutes = 540
        
        cur.execute("""
            INSERT INTO Attendance (id, employeeId, date, punchIn, punchOut, status, totalMinutes)
            VALUES (?, ?, ?, ?, ?, 'PRESENT', ?)
        """, (new_id, emp_id, date_val, punch_in_val, punch_out_val, total_minutes))
        print(f"  ✓ Inserted new Attendance record {new_id} for 2026-09-22 (9:30 AM - 6:30 PM, 540 mins)")

    # Also close any open EmployeeStatusEvent for 2026-09-22
    cur.execute("""
        SELECT id, startedAt, endedAt, statusType
        FROM EmployeeStatusEvent
        WHERE employeeId = ? AND (startedAt LIKE '%2026-09-22%' OR startedAt BETWEEN 1790000000000 AND 1800000000000)
    """, (emp_id,))
    events = cur.fetchall()
    for ev in events:
        ev_id, s_at, e_at, stype = ev
        if not e_at:
            if isinstance(s_at, str) and 'T' in s_at:
                end_iso = "2026-09-22T13:00:00.000Z"
            elif isinstance(s_at, (int, float)):
                end_iso = int(datetime(2026, 9, 22, 13, 0, 0).timestamp() * 1000)
            else:
                end_iso = "2026-09-22 13:00:00"
            cur.execute("UPDATE EmployeeStatusEvent SET endedAt = ? WHERE id = ?", (end_iso, ev_id))
            print(f"  ✓ Closed open status event {ev_id} at 18:30 IST")

conn.commit()

# Verify
print("\n=== VERIFICATION FOR RIYA SONI ===")
cur.execute("""
    SELECT id, date, punchIn, punchOut, totalMinutes, status
    FROM Attendance
    WHERE employeeId = ?
    ORDER BY date DESC
    LIMIT 5
""", (emp_id,))
for a in cur.fetchall():
    print(f"  ID: {a[0]} | Date: {a[1]} | In: {a[2]} | Out: {a[3]} | TotalMin: {a[4]} | Status: {a[5]}")

conn.close()
print("\n Done! Everything updated successfully.")
