import sqlite3
import os
import glob
import time
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

# Get all employees
cur.execute("""
    SELECT e.id, u.name, e.employeeIdCode
    FROM Employee e
    JOIN User u ON e.userId = u.id
""")
employees = cur.fetchall()

print(f"Total employees: {len(employees)}")

reopened_count = 0
for emp_id, name, emp_code in employees:
    # Find their latest attendance record
    cur.execute("""
        SELECT id, date, punchIn, punchOut, totalMinutes, status
        FROM Attendance
        WHERE employeeId = ?
        ORDER BY date DESC
        LIMIT 1
    """, (emp_id,))
    latest = cur.fetchone()
    
    if latest:
        att_id, a_date, p_in, p_out, total_mins, status = latest
        
        # Reset the latest record so punchOut is NULL and they are currently working
        cur.execute("""
            UPDATE Attendance
            SET punchOut = NULL,
                totalMinutes = 0,
                status = 'PRESENT',
                punchOutReason = NULL,
                punchOutRequestStatus = NULL
            WHERE id = ?
        """, (att_id,))
        
        # Also reopen their status event
        cur.execute("""
            UPDATE EmployeeStatusEvent
            SET endedAt = NULL
            WHERE employeeId = ? AND id = (
                SELECT id FROM EmployeeStatusEvent WHERE employeeId = ? ORDER BY startedAt DESC LIMIT 1
            )
        """, (emp_id, emp_id))
        
        print(f"  ✓ {name} ({emp_code}): Reset latest attendance {att_id} -> punchOut is now NULL (Actively Working)")
        reopened_count += 1

conn.commit()

# Verify everyone's status now
print("\n=== CURRENT STATUS AFTER FIX ===")
cur.execute("""
    SELECT u.name, e.employeeIdCode, a.punchIn, a.punchOut, a.status
    FROM Attendance a
    JOIN Employee e ON a.employeeId = e.id
    JOIN User u ON e.userId = u.id
    GROUP BY e.id
    HAVING a.date = MAX(a.date)
""")
for r in cur.fetchall():
    print(f"  {r[0]} ({r[1]}): In: {r[2]} | Out: {r[3]} | Status: {r[4]}")

conn.close()
print(f"\n✅ Successfully reset {reopened_count} employees back to Active Working!")
