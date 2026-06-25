'use server';

import { connectToDatabase } from '../lib/db';
import { ObjectId } from 'mongodb';

export interface QueueItem {
  _id: string; // This is the billId
  patientId: string;
  patientName: string;
  doctorName: string;
  amount: number;
  triageStatus: 'Emergency' | 'Normal' | 'Review';
  checkupStatus: 'waiting' | 'called' | 'completed';
  createdAt: string;
}

export async function fetchConsultationQueue(): Promise<{ success: boolean; data: QueueItem[] }> {
  try {
    const { db } = await connectToDatabase();
    const appointments = await db.collection('bills')
      .find({ department: 'Appointment', status: 'paid', checkupStatus: { $ne: 'completed' } })
      .sort({ createdAt: 1 })
      .toArray();

    return {
      success: true,
      data: appointments.map(doc => ({
        _id: doc._id.toString(),
        patientId: doc.patientId,
        patientName: doc.billeeName,
        doctorName: doc.doctorName || 'General Duty Medical Officer',
        amount: doc.amount,
        triageStatus: doc.triageStatus || (doc.amount > 500 ? 'Emergency' : 'Normal'),
        checkupStatus: doc.checkupStatus || 'waiting',
        createdAt: new Date(doc.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      }))
    };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function triggerPatientCall(billId: string, patientName: string, patientId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('bills').updateOne({ _id: new ObjectId(billId) }, { $set: { checkupStatus: 'called' } });
    return { success: true, message: `Call notification active for ${patientName}.` };
  } catch (error) {
    return { success: false, message: 'Notification network transmission error.' };
  }
}

export async function completePatientCheckup(billId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('bills').updateOne({ _id: new ObjectId(billId) }, { $set: { checkupStatus: 'completed', completedAt: new Date() } });
    return { success: true, message: 'Patient checkup completed and removed from queue.' };
  } catch (error) {
    return { success: false, message: 'Failed to update patient queue status.' };
  }
}