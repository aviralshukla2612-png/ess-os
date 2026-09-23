import sqlite3
import os
import glob

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

# Find Riya Soni's employee ID
cur.execute("""
    SELECT e.id, u.name, e.employeeIdCode
    FROM Employee e
    JOIN User u ON e.userId = u.id
    WHERE LOWER(u.name) LIKE '%riya%'
""")
emp_row = cur.fetchone()

if not emp_row:
    print("Riya Soni not found!")
    conn.close()
    exit(1)

emp_id, name, emp_code = emp_row
print(f"Found employee: {name} ({emp_code})")

# Look at all recent records for Riya Soni
cur.execute("""
    SELECT id, date, punchIn, punchOut, totalMinutes, status
    FROM Attendance
    WHERE employeeId = ?
    ORDER BY date DESC
    LIMIT 5
""", (emp_id,))

rows = cur.fetchall()
print("\nRecent records for Riya Soni:")
for r in rows:
    print(r)

# 1. Update the latest record (Today's punch in at ~09:44 AM) to punchOut = NULL
if rows:
    today_att_id = rows[0][0]
    cur.execute("""
        UPDATE Attendance
        SET punchOut = NULL,
            totalMinutes = 0,
            status = 'PRESENT',
            punchOutReason = NULL,
            punchOutRequestStatus = NULL
        WHERE id = ?
    """, (today_att_id,))
    
    # Also ensure status event is open
    cur.execute("""
        UPDATE EmployeeStatusEvent
        SET endedAt = NULL
        WHERE employeeId = ? AND id = (
            SELECT id FROM EmployeeStatusEvent WHERE employeeId = ? ORDER BY startedAt DESC LIMIT 1
        )
    """, (emp_id, emp_id))
    print(f"\n✓ Cleared punchOut for Riya Soni's latest record ({today_att_id}). She is now Actively Working!")

conn.commit()

# Verify
cur.execute("""
    SELECT id, date, punchIn, punchOut, totalMinutes, status
    FROM Attendance
    WHERE employeeId = ?
    ORDER BY date DESC
    LIMIT 3
""", (emp_id,))
print("\nVerified records for Riya Soni:")
for r in cur.fetchall():
    print(r)

conn.close()
print("\n✅ Done! Refresh the team attendance page and Riya Soni will show '--' (Active Working).")
