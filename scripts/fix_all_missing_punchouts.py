import sqlite3
import os
import glob
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
    print("Database not found!")
    exit(1)

conn = sqlite3.connect(db_file)
cur = conn.cursor()

# Today's date string (to avoid touching today's active punches)
today_str = datetime.now().strftime("%Y-%m-%d")

print(f"Checking for past unclosed/pending punch-outs prior to {today_str}...")

cur.execute("""
    SELECT a.id, u.name, e.employeeIdCode, a.date, a.punchIn, a.punchOut, a.punchOutRequestStatus, a.totalMinutes
    FROM Attendance a
    JOIN Employee e ON a.employeeId = e.id
    JOIN User u ON e.userId = u.id
    WHERE (a.punchOut IS NULL OR a.punchOutRequestStatus = 'PENDING' OR a.totalMinutes = 0 OR a.totalMinutes IS NULL)
      AND a.date NOT LIKE ?
      AND a.punchIn NOT LIKE ?
    ORDER BY a.date DESC
""", (f"%{today_str}%", f"%{today_str}%"))

rows = cur.fetchall()
print(f"Found {len(rows)} attendance records from past days that were never closed or left pending:")

fixed_count = 0
for att_id, name, emp_code, a_date, p_in, p_out, req_status, total_mins in rows:
    print(f"\nFixing record for {name} ({emp_code}):")
    print(f"  Date: {a_date} | In: {p_in} | Current Out: {p_out} | ReqStatus: {req_status} | Mins: {total_mins}")
    
    # Calculate appropriate punchOut based on punchIn date
    # Usually punch in is morning, punch out at ~18:30 IST (13:00 UTC)
    if p_in:
        if isinstance(p_in, str) and 'T' in p_in:
            date_part = p_in.split('T')[0]
            new_punch_out = f"{date_part}T13:00:00.000Z"
        elif isinstance(p_in, (int, float)):
            # timestamp
            d_obj = datetime.fromtimestamp(p_in / 1000)
            new_punch_out = int(datetime(d_obj.year, d_obj.month, d_obj.day, 13, 0, 0).timestamp() * 1000)
        else:
            date_part = str(p_in).split(' ')[0]
            new_punch_out = f"{date_part} 13:00:00"
    else:
        new_punch_out = f"{str(a_date).split('T')[0]}T13:00:00.000Z"
        
    calc_minutes = 540 # 9 hrs standard
    
    cur.execute("""
        UPDATE Attendance
        SET punchOut = ?,
            totalMinutes = ?,
            status = 'PRESENT',
            punchOutRequestStatus = 'APPROVED',
            punchOutReason = NULL
        WHERE id = ?
    """, (new_punch_out, calc_minutes, att_id))
    
    # Close any open status events for that employee on that day
    cur.execute("""
        UPDATE EmployeeStatusEvent
        SET endedAt = ?
        WHERE employeeId = (SELECT employeeId FROM Attendance WHERE id = ?) AND endedAt IS NULL
    """, (new_punch_out, att_id))
    
    fixed_count += 1
    print(f"  ✓ Fixed: punchOut -> 6:30 PM IST ({new_punch_out}), totalMinutes -> 540 (9h), Status -> PRESENT")

conn.commit()
conn.close()

print(f"\n Successfully resolved and updated {fixed_count} past attendance records across all employees!")
