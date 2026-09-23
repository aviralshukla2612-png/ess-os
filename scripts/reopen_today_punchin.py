import sqlite3
import os
import glob
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
conn = sqlite3.connect(db_file)
cur = conn.cursor()

# Find all records for today (2026-09-23)
cur.execute("""
    SELECT a.id, u.name, u.email, e.id, a.date, a.punchIn, a.punchOut, a.status, a.totalMinutes
    FROM Attendance a
    JOIN Employee e ON a.employeeId = e.id
    JOIN User u ON e.userId = u.id
    WHERE a.date LIKE '%2026-09-23%' OR a.punchIn LIKE '%2026-09-23%'
    ORDER BY a.punchIn DESC
""")

records = cur.fetchall()
print(f"Found {len(records)} records for TODAY (2026-09-23):")
for r in records:
    print(r)

# Re-open today's attendance (set punchOut = NULL, status = 'PRESENT') for anyone who punched in today
for att_id, name, email, emp_id, a_date, p_in, p_out, status, total_mins in records:
    print(f"\nResetting today's punch-in for: {name} ({email})")
    cur.execute("""
        UPDATE Attendance
        SET punchOut = NULL,
            status = 'PRESENT',
            punchOutReason = NULL,
            punchOutRequestStatus = NULL
        WHERE id = ?
    """, (att_id,))
    
    # Also ensure they have an open EmployeeStatusEvent (WORKING) starting at their punch-in
    cur.execute("""
        UPDATE EmployeeStatusEvent
        SET endedAt = NULL
        WHERE employeeId = ? AND (startedAt LIKE '%2026-09-23%' OR startedAt >= ?)
    """, (emp_id, p_in))
    
    print(f"  ✓ Reopened today's shift for {name}! (punchOut is now NULL, actively WORKING)")

conn.commit()
conn.close()
print("\n Done! Refresh your browser now and you will be back to Working / Clock running.")
