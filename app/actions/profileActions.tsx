'use server';

import { connectToDatabase } from '../lib/db';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function requestPasswordChangeOTP(userId: string, oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) return { success: false, message: "User not found." };

    const isMatch = await bcrypt.compare(oldPass, user.password || "");
    if (!isMatch && oldPass !== user.password) {
      return { success: false, message: "Incorrect current password." };
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!strongPasswordRegex.test(newPass)) {
      return { success: false, message: "Password must be 12+ characters with uppercase, lowercase, number, and symbol." };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { securityOtp: { code: otp, expiresAt: otpExpiry } } }
    );

    console.log(`\n📧 SECURE EMAIL TO ${user.email} -> YOUR IDHN PASSWORD RESET OTP IS: ${otp}\n`);

    return { success: true, message: "OTP sent to registered email." };
  } catch (error) {
    return { success: false, message: "Server error processing request." };
  }
}

export async function verifyAndChangePassword(userId: string, otpInput: string, newPass: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user || !user.securityOtp) return { success: false, message: "No active password change request." };

    if (user.securityOtp.code !== otpInput) return { success: false, message: "Invalid OTP code." };
    if (new Date() > new Date(user.securityOtp.expiresAt)) return { success: false, message: "OTP has expired. Try again." };

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPass, salt);

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { password: hashedPassword },
        $unset: { securityOtp: "" } 
      }
    );

    await db.collection('audit_logs').insertOne({
      action: 'PASSWORD_CHANGE_SUCCESS',
      userId: user._id.toString(),
      email: user.email,
      timestamp: new Date(),
      ipAddress: "System Log", 
    });

    return { success: true, message: "Password securely updated." };
  } catch (error) {
    return { success: false, message: "Server error verifying OTP." };
  }
}
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

export async function updateUserProfile(userId: string, payload: any): Promise<{ success: boolean }> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: payload } 
    );
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

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