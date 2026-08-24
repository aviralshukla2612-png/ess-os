import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const currentUser = authRes;

  try {
    const body = await req.json();
    const { type, currentPassword, newValue, confirmValue } = body;

    if (!type || !currentPassword || !newValue) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch the full user record with passwordHash
    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password (supports both bcrypt and plain text for prototype)
    let passwordValid = false;
    if (dbUser.passwordHash.startsWith("$2")) {
      // bcrypt hash
      passwordValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    } else {
      // plain text (prototype practice credentials)
      passwordValid = dbUser.passwordHash === currentPassword;
    }

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    if (type === "email") {
      // Validate new email
      if (!newValue.includes("@")) {
        return NextResponse.json(
          { success: false, error: "Invalid email address" },
          { status: 400 }
        );
      }

      // Check if new email is already taken by another user
      const existing = await prisma.user.findUnique({
        where: { email: newValue },
      });
      if (existing && existing.id !== currentUser.id) {
        return NextResponse.json(
          { success: false, error: "Email is already in use by another account" },
          { status: 409 }
        );
      }

      await prisma.user.update({
        where: { id: currentUser.id },
        data: { email: newValue },
      });

      return NextResponse.json({
        success: true,
        message: "Email updated successfully. Please log in again with your new email.",
      });
    }

    if (type === "password") {
      if (!confirmValue || newValue !== confirmValue) {
        return NextResponse.json(
          { success: false, error: "New passwords do not match" },
          { status: 400 }
        );
      }

      if (newValue.length < 4) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 4 characters" },
          { status: 400 }
        );
      }

      // Hash the new password with bcrypt
      const newHash = await bcrypt.hash(newValue, 10);

      await prisma.user.update({
        where: { id: currentUser.id },
        data: { passwordHash: newHash },
      });

      return NextResponse.json({
        success: true,
        message: "Password updated successfully.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid update type. Must be 'email' or 'password'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update credentials error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update credentials" },
      { status: 500 }
    );
  }
}
