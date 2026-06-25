'use server';

import { connectToDatabase } from '../lib/db';
import { ObjectId } from 'mongodb';

export interface DoctorSelectOption {
  id: string;
  name: string;
  expertise: string;
}

export interface GroupedDoctors {
  _id: string;
  doctors: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export async function updateDoctorStatus(doctorId: string, isAvailable: boolean, department?: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    const updatePayload: any = { isAvailable };
    if (department) {
      updatePayload.department = department;
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(doctorId) },
      { $set: updatePayload }
    );

    return result.matchedCount > 0 
      ? { success: true, message: 'Practitioner availability updated.' }
      : { success: false, message: 'Doctor record not found.' };
  } catch (error) {
    console.error('Failed to update doctor profile:', error);
    return { success: false, message: 'Driver mutation error encountered.' };
  }
}

export async function fetchAvailableDoctors(): Promise<{ success: boolean; data: DoctorSelectOption[] }> {
  try {
    const { db } = await connectToDatabase();
    const doctors = await db.collection('users')
      .find({ role: 'Doctor' })
      .project({ name: 1, department: 1 })
      .toArray();

    const formattedDoctors = doctors.map(doc => ({
      id: doc._id.toString(),
      name: doc.name,
      expertise: doc.department || 'General Medicine' 
    }));

    return { success: true, data: formattedDoctors };
  } catch (error) {
    console.error('Failed to load doctors dropdown options:', error);
    return { success: false, data: [] };
  }
}

export async function fetchDoctorsGroupedByExpertise(): Promise<{ success: boolean; data: GroupedDoctors[] }> {
  try {
    const { db } = await connectToDatabase();
    const pipeline = [
      { $match: { role: { $regex: /^doctor$/i } } },
      {
        $group: {
          _id: { $ifNull: ["$department", "General Medicine"] },
          doctors: {
            $push: {
              id: { $toString: "$_id" },
              name: "$name",
              email: "$email"
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const result = await db.collection('users').aggregate(pipeline).toArray() as unknown as GroupedDoctors[];
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to aggregate grouped doctors:", error);
    return { success: false, data: [] };
  }
}

export async function deleteAppointment(appointmentId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('appointments').deleteOne({
      _id: new ObjectId(appointmentId)
    });

    return result.deletedCount > 0
      ? { success: true, message: 'Appointment slot cleanly purged.' }
      : { success: false, message: 'Target entry index missing.' };
  } catch (error) {
    console.error('Delete transaction failed:', error);
    return { success: false, message: 'Database deletion request rejected.' };
  }
}