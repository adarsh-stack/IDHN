'use server';

import { connectToDatabase } from '../lib/db';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// ... (Keep all your existing fetchUserProfile, updateUserProfile, etc.)

// --- 5. HIGH SECURITY: REQUEST OTP FOR PASSWORD CHANGE ---
export async function requestPasswordChangeOTP(userId: string, oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) return { success: false, message: "User not found." };

    // 1. Verify Old Password (Assuming passwords in DB are hashed. If testing with plain text, you may need a fallback here temporarily)
    const isMatch = await bcrypt.compare(oldPass, user.password || "");
    // Fallback for dev environment if you currently have plain text passwords:
    if (!isMatch && oldPass !== user.password) {
      return { success: false, message: "Incorrect current password." };
    }

    // 2. Enforce Strict Password Policy
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!strongPasswordRegex.test(newPass)) {
      return { success: false, message: "Password must be 12+ characters with uppercase, lowercase, number, and symbol." };
    }

    // 3. Generate 6-Digit OTP & Expiry (10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Save OTP temporarily to user record
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { securityOtp: { code: otp, expiresAt: otpExpiry } } }
    );

    // 5. SIMULATE EMAIL SENDING (Replace this `console.log` with Resend/Nodemailer later)
    console.log(`\n📧 SECURE EMAIL TO ${user.email} -> YOUR IDHN PASSWORD RESET OTP IS: ${otp}\n`);

    return { success: true, message: "OTP sent to registered email." };
  } catch (error) {
    return { success: false, message: "Server error processing request." };
  }
}

// --- 6. HIGH SECURITY: VERIFY OTP AND COMMIT NEW PASSWORD ---
export async function verifyAndChangePassword(userId: string, otpInput: string, newPass: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user || !user.securityOtp) return { success: false, message: "No active password change request." };

    // 1. Verify OTP and Expiry
    if (user.securityOtp.code !== otpInput) return { success: false, message: "Invalid OTP code." };
    if (new Date() > new Date(user.securityOtp.expiresAt)) return { success: false, message: "OTP has expired. Try again." };

    // 2. Hash the new password securely
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPass, salt);

    // 3. Update Password & Clear OTP
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { password: hashedPassword },
        $unset: { securityOtp: "" } 
      }
    );

    // 4. Write to Audit Log
    await db.collection('audit_logs').insertOne({
      action: 'PASSWORD_CHANGE_SUCCESS',
      userId: user._id.toString(),
      email: user.email,
      timestamp: new Date(),
      ipAddress: "System Log", // You can extract real IPs in Next.js headers later
    });

    return { success: true, message: "Password securely updated." };
  } catch (error) {
    return { success: false, message: "Server error verifying OTP." };
  }
}
// 1. Fetch a single user's complete profile
export async function fetchUserProfile(userId: string): Promise<{ success: boolean; data: any }> {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    if (!user) return { success: false, data: null };
    
    return { 
      success: true, 
      data: { ...user, _id: user._id.toString() } 
    };
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return { success: false, data: null };
  }
}

// 2. Update a user's personal details
export async function updateUserProfile(userId: string, payload: any): Promise<{ success: boolean }> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: payload } // Updates fields like phone, address, degree, etc.
    );
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 3. DOCTOR ONLY: Fetch all staff members from the central database
export async function fetchAllStaff(): Promise<{ success: boolean; data: any[] }> {
  try {
    const { db } = await connectToDatabase();
    const staff = await db.collection('users')
      .find({ role: { $in: ['Doctor', 'Receptionist', 'Pharmacy'] } })
      .toArray();

    return { 
      success: true, 
      data: staff.map(s => ({ ...s, _id: s._id.toString() })) 
    };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// 4. DOCTOR ONLY: Update a Pharmacist/Receptionist shift & location
export async function updateStaffAllocation(staffId: string, location: string, shift: string): Promise<{ success: boolean }> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('users').updateOne(
      { _id: new ObjectId(staffId) },
      { $set: { location, shift } }
    );
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}