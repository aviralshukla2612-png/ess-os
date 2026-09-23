import sqlite3
import os
import glob
import time
from datetime import datetime, timedelta

# Find sqlite database file
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
    print(f"Employee: {name} ({email}) | EmployeeID: {emp_id} | Code: {emp_code}")
    print(f"==========================================")
    if not emp_id:
        print("No employee record linked.")
        continue

    # Show all recent attendances
    cur.execute("""
        SELECT id, date, punchIn, punchOut, totalMinutes, status, punchOutRequestStatus, punchOutReason
        FROM Attendance
        WHERE employeeId = ?
        ORDER BY date DESC
        LIMIT 10
    """, (emp_id,))
    atts = cur.fetchall()
    print("Recent Attendance Records:")
    for a in atts:
        print(f"  ID: {a[0]} | Date: {a[1]} | In: {a[2]} | Out: {a[3]} | TotalMin: {a[4]} | Status: {a[5]} | ReqStatus: {a[6]} | Reason: {a[7]}")

    # Let's inspect events for yesterday & today
    # Calculate yesterday date
    now = datetime.now()
    yesterday = now - timedelta(days=1)
    
    # Check if there is an attendance record for yesterday (or last 2 days) where punchOut is missing or needs fixing
    cur.execute("""
        SELECT id, date, punchIn, punchOut, totalMinutes, status
        FROM Attendance
        WHERE employeeId = ?
        ORDER BY date DESC
    """, (emp_id,))
    all_atts = cur.fetchall()

    for att_id, a_date, p_in, p_out, total_mins, status in all_atts:
        # Check if date corresponds to yesterday or has null punchOut or 0 totalMinutes
        print(f"\nEvaluating Attendance ID: {att_id}, Date: {a_date}, In: {p_in}, Out: {p_out}")

# We can also fix it directly if specified
conn.close()
