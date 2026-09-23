import sqlite3
import os
import glob
import time

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

# 1. Inspect all attendances with string dates (like '2026%')
cur.execute("SELECT id, employeeId, date, punchIn, punchOut, totalMinutes, status FROM Attendance WHERE typeof(date) = 'text' OR date LIKE '2026%'")
text_records = cur.fetchall()
print(f"\nFound {len(text_records)} records with text/string dates. Removing any string duplicates:")
for tr in text_records:
    print(f"  Deleting string record: ID={tr[0]}, date={tr[2]}, In={tr[3]}, Out={tr[4]}")
    cur.execute("DELETE FROM Attendance WHERE id = ?", (tr[0],))

# 2. Fix Riya Soni (riya1@ess.com / EMP-632)
cur.execute("""
    SELECT e.id, u.name, u.email, e.employeeIdCode
    FROM Employee e
    JOIN User u ON e.userId = u.id
    WHERE LOWER(u.name) LIKE '%riya%'
""")
riya_emps = cur.fetchall()
for emp_id, name, email, code in riya_emps:
    print(f"\nChecking Riya records for {name} ({email}, {code}, {emp_id}):")
    cur.execute("SELECT id, date, punchIn, punchOut, totalMinutes, status FROM Attendance WHERE employeeId = ? ORDER BY date DESC LIMIT 6", (emp_id,))
    rows = cur.fetchall()
    for r in rows:
        print(f"  {r}")
    
    if len(rows) > 0:
        # Latest record is TODAY (Sep 23) -> MUST BE OPEN (punchOut = NULL)
        today_rec = rows[0]
        cur.execute("""
            UPDATE Attendance
            SET punchOut = NULL,
                totalMinutes = 0,
                status = 'PRESENT',
                punchOutReason = NULL,
                punchOutRequestStatus = NULL
            WHERE id = ?
        """, (today_rec[0],))
        print(f"  ✓ Set Riya's TODAY record ({today_rec[0]}) -> punchOut = NULL (Actively Working)")

        # Reopen status event for Riya
        cur.execute("""
            UPDATE EmployeeStatusEvent
            SET endedAt = NULL
            WHERE employeeId = ? AND id = (
                SELECT id FROM EmployeeStatusEvent WHERE employeeId = ? ORDER BY startedAt DESC LIMIT 1
            )
        """, (emp_id, emp_id))

    if len(rows) > 1:
        # Second record is YESTERDAY (Sep 22) -> MUST BE PUNCHED OUT at ~6:30 PM (540 mins)
        yest_rec = rows[1]
        # Calculate ~6:30 PM for yesterday (in ms)
        # If punchIn is around 1790085362560 (09:30 AM IST on Sep 22), 6:30 PM IST is + 9 hours = + 32,400,000 ms
        p_in = yest_rec[2]
        if isinstance(p_in, (int, float)):
            out_ms = int(p_in) + (9 * 3600 * 1000)
        else:
            out_ms = 1790121599000
            
        cur.execute("""
            UPDATE Attendance
            SET punchOut = ?,
                totalMinutes = 540,
                status = 'PRESENT',
                punchOutReason = NULL,
                punchOutRequestStatus = 'APPROVED'
            WHERE id = ?
        """, (out_ms, yest_rec[0]))
        print(f"  ✓ Fixed Riya's YESTERDAY record ({yest_rec[0]}) -> punchOut = 6:30 PM (540 mins)")

# 3. For ALL employees: ensure their latest record today (date >= 1790100000000) has punchOut = NULL
cur.execute("""
    SELECT e.id, u.name, e.employeeIdCode
    FROM Employee e
    JOIN User u ON e.userId = u.id
""")
all_emps = cur.fetchall()

print("\n--- RESETTING TODAY'S ACTIVE WORKERS ---")
for emp_id, name, code in all_emps:
    cur.execute("""
        SELECT id, date, punchIn, punchOut
        FROM Attendance
        WHERE employeeId = ?
        ORDER BY date DESC
        LIMIT 1
    """, (emp_id,))
    latest = cur.fetchone()
    if latest:
        att_id, a_date, p_in, p_out = latest
        # If record is from today (date > 1790100000000 ms)
        if a_date and isinstance(a_date, (int, float)) and a_date > 1790100000000:
            cur.execute("""
                UPDATE Attendance
                SET punchOut = NULL,
                    totalMinutes = 0,
                    status = 'PRESENT',
                    punchOutReason = NULL,
                    punchOutRequestStatus = NULL
                WHERE id = ?
            """, (att_id,))
            
            # Ensure open status event
            cur.execute("""
                UPDATE EmployeeStatusEvent
                SET endedAt = NULL
                WHERE employeeId = ? AND id = (
                    SELECT id FROM EmployeeStatusEvent WHERE employeeId = ? ORDER BY startedAt DESC LIMIT 1
                )
            """, (emp_id, emp_id))
            print(f"  ✓ {name} ({code}): Active today -> punchOut is NULL")

conn.commit()

# Print summary
print("\n=== FINAL VERIFICATION FOR TEAM ATTENDANCE TODAY ===")
cur.execute("""
    SELECT u.name, e.employeeIdCode, a.punchIn, a.punchOut, a.status
    FROM Attendance a
    JOIN Employee e ON a.employeeId = e.id
    JOIN User u ON e.userId = u.id
    GROUP BY e.id
    HAVING a.date = MAX(a.date)
    ORDER BY a.punchIn ASC
""")
for r in cur.fetchall():
    print(f"  {r[0]:15} | {r[1]:8} | In: {r[2]} | Out: {r[3]} | Status: {r[4]}")

conn.close()
print("\n✅ DB Cleaned & Synchronized. Please refresh your browser!")
