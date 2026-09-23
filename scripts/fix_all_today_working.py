import sqlite3
import os
import glob

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

# Find all records for September 23, 2026
cur.execute("""
    SELECT a.id, u.name, e.id, a.punchIn
    FROM Attendance a
    JOIN Employee e ON a.employeeId = e.id
    JOIN User u ON e.userId = u.id
    WHERE a.date LIKE '%2026-09-23%' OR a.punchIn LIKE '%2026-09-23%'
""")

rows = cur.fetchall()
print(f"Found {len(rows)} employees punched in today (Sep 23). Resetting all to Active Working:")

for att_id, name, emp_id, p_in in rows:
    # 1. Reset Attendance record: punchOut to NULL
    cur.execute("""
        UPDATE Attendance
        SET punchOut = NULL,
            totalMinutes = 0,
            status = 'PRESENT',
            punchOutReason = NULL,
            punchOutRequestStatus = NULL
        WHERE id = ?
    """, (att_id,))
    
    # 2. Re-open their current status event (WORKING)
    cur.execute("""
        UPDATE EmployeeStatusEvent
        SET endedAt = NULL
        WHERE employeeId = ? AND (startedAt LIKE '%2026-09-23%' OR startedAt >= ?)
    """, (emp_id, p_in))
    
    print(f"  ✓ {name}: Shift reopened, punchOut removed -> Actively Working.")

conn.commit()
conn.close()
print(f"\n✅ All {len(rows)} employees are now active for today (Sep 23)! Refresh your browser.")
