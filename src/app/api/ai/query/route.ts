import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const lower = (prompt || "").toLowerCase();

    let responseText = "";

    if (lower.includes("brief") || lower.includes("morning") || lower.includes("today")) {
      responseText = `Good morning Rahul.

Here is your MDZ OS Executive Morning Brief for today:
1. 👥 **14 / 16 Employees Present** (2 on scheduled leave).
2. 🚀 **17 Active Projects** (12 on track, 3 at risk, 2 delayed).
3. 🔴 **Project ABC is 2 days delayed**: Backend testing is waiting on Razorpay production credentials from Rajesh Mehta (Client).
4. 💰 **₹85,000 Overdue**: Invoice INV-2026-002 for ABC Retailers is overdue by 3 days.
5. 📞 **7 Sales Follow-ups** scheduled today by Karan Verma.

    } else if (lower.includes("delay") || lower.includes("abc") || lower.includes("risk")) {
      responseText = `Analysing delay factors for **Project ABC (ABC E-Commerce Storefront & Mobile API)**:

• **Calculated Weighted Progress**: 72% (Planning 100%, Design 100%, Development 68%, QA 20%).
• **Primary Root Causes**:
  1. **Credential Dependency**: Production Razorpay API credentials were delivered 2 days late by client.
  2. **Approved Scope Change (CR-2026-001)**: Client added multi-address shipping & gift messaging (+4 days timeline impact, +₹25,000).
  3. **Historical Team Adjustment**: Priya Desai completed UI/UX and was reassigned on July 20th; Dev Patel is handling full-stack integration.
• **Recommended Owner Action**: Contact Rajesh Mehta to verify production webhook endpoints & follow up on overdue Milestone 2 invoice (₹1,00,000).`;
    } else if (lower.includes("payment") || lower.includes("money") || lower.includes("due") || lower.includes("invoice")) {
      responseText = `Financial Summary from MDZ OS Engine:

• **Total Pipeline Value**: ₹14,80,000 across 14 sales leads.
• **Upcoming Collections (August)**: ₹3,20,000 across 4 milestones.
• **Overdue Amount**: ₹85,000 (ABC Retailers Pvt Ltd - Milestone 2 Invoice INV-2026-002).
• **Received This Month**: ₹1,00,000 (Milestone 1 Advance for Project ABC).`;
    } else {
      responseText = `MDZ AI Analysis:

Based on recorded system events:
• All employee work sessions, stage checklists, and meeting decision logs are up to date.
• Project ABC is at 72% progress.

• You can ask me: "Why is Project ABC delayed?", "Show morning brief", or "Which payments are overdue?".`;
    }

    return NextResponse.json({ success: true, answer: responseText });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to generate AI response" }, { status: 500 });
  }
}
