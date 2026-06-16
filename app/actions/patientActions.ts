'use server';

import { connectToDatabase } from '../lib/db';
import { ObjectId } from 'mongodb';

export interface PatientRecord {
  _id?: string;
  name: string;
  age: number;
  gender: string;
  mrn: string; 
  abhaLinked: boolean;
  lastVisit: string;
  assignedDoctor: string;
  phone?: string;
  abhaId?: string;
}

export interface PatientVitals {
  _id?: string;
  patientId: string;
  date: string;
  bloodPressure: string;
  pulseRate: number;     
  temperature: number;   
  recordedBy: string;
}

export interface MedicalEncounter {
  _id: string;
  patientId: string;
  date: string;
  doctorName: string;
  diagnosis: string;
  medications: string[];
  clinicalNotes: string;
  vitalsSnapshot?: {
    bloodPressure: string;
    pulseRate: number;
    temperature: number;
    weight: number;
    height: number;
    sugar: number;
  };
}

export async function fetchPatients(searchQuery?: string): Promise<{ success: boolean; data: PatientRecord[] }> {
  try {
    const { db } = await connectToDatabase();
    let filter: any = {};
    if (searchQuery) {
      filter = {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { mrn: { $regex: searchQuery, $options: 'i' } },
          { phone: { $regex: searchQuery, $options: 'i' } },
          { abhaId: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }
    const patients = await db.collection('patients').find(filter).sort({ createdAt: -1 }).toArray();
    
    const formattedPatients = patients.map(doc => ({
      ...doc,
      _id: doc._id.toString(),
    })) as unknown as PatientRecord[];

    return { success: true, data: formattedPatients };
  } catch (error) {
    console.error("Failed to query patients list:", error);
    return { success: false, data: [] };
  }
}

export async function registerPatient(formData: FormData): Promise<{ success: boolean; message: string }> {
  const name = formData.get('name') as string;
  const age = parseInt(formData.get('age') as string);
  const gender = formData.get('gender') as string;
  const phone = formData.get('phone') as string;
  const abhaId = formData.get('abhaId') as string;
  const assignedDoctor = formData.get('assignedDoctor') as string;

  if (!name || !age || !gender || !assignedDoctor) {
    return { success: false, message: 'Missing mandatory registration metrics.' };
  }

  try {
    const { db } = await connectToDatabase();
    const sequenceToken = Math.floor(1000 + Math.random() * 9000);
    const generatedMrn = `IDHN-${new Date().getFullYear()}-${sequenceToken}`;

    const newPatient = {
      name,
      age,
      gender,
      phone,
      abhaId,
      mrn: generatedMrn,
      abhaLinked: abhaId ? true : false,
      lastVisit: new Date().toLocaleDateString('en-GB'), 
      assignedDoctor,
      createdAt: new Date()
    };

    await db.collection('patients').insertOne(newPatient);

    await db.collection('audit_logs').insertOne({
      action: 'PATIENT_RECORD_INITIALIZED',
      generatedMrn,
      assignedDoctor,
      timestamp: new Date()
    });

    return { success: true, message: 'Patient logged successfully!' };
  } catch (error) {
    console.error("Patient insertion failed:", error);
    return { success: false, message: 'Database write exception encountered.' };
  }
}

export async function updatePatientProfile(patientId: string, updatedFields: Partial<PatientRecord>): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    const { _id, mrn, ...safeFieldsToUpdate } = updatedFields as any;

    const result = await db.collection('patients').updateOne(
      { _id: new ObjectId(patientId) },
      { $set: safeFieldsToUpdate }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: 'Patient profile registry not found.' };
    }

    await db.collection('audit_logs').insertOne({
      action: 'PATIENT_RECORD_ALTERED',
      targetPatientId: patientId,
      timestamp: new Date()
    });

    return { success: true, message: 'Patient metrics modified successfully.' };
  } catch (error) {
    console.error('Failed to alter patient file:', error);
    return { success: false, message: 'Database alteration transaction failed.' };
  }
}

export async function submitNursingVitals(vitals: Omit<PatientVitals, '_id'>): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('vitals').insertOne({
      ...vitals,
      pulseRate: Number(vitals.pulseRate),
      temperature: Number(vitals.temperature),
      createdAt: new Date()
    });

    return { success: true, message: 'Vitals committed successfully.' };
  } catch (error) {
    console.error('Failed to log nursing vitals:', error);
    return { success: false, message: 'Database write error.' };
  }
}

export async function fetchPatientClinicalHistory(patientId: string): Promise<{
  success: boolean;
  vitalsHistory: PatientVitals[];
  encounters: MedicalEncounter[];
}> {
  try {
    const { db } = await connectToDatabase();

    const vitalsDocs = await db.collection('vitals')
      .find({ patientId })
      .sort({ createdAt: 1 }) 
      .toArray();

    const encounterDocs = await db.collection('encounters')
      .find({ patientId })
      .sort({ createdAt: -1 }) 
      .toArray();

    return {
      success: true,
      vitalsHistory: vitalsDocs.map(d => ({ ...d, _id: d._id.toString() })) as unknown as PatientVitals[],
      encounters: encounterDocs.map(d => ({ ...d, _id: d._id.toString() })) as unknown as MedicalEncounter[]
    };
  } catch (error) {
    console.error('Failed to pull historic profile reports:', error);
    return { success: false, vitalsHistory: [], encounters: [] };
  }
}