"use server";

import { connectToDatabase } from "../lib/db";
import { ObjectId } from "mongodb";

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
  sugar?: number;
  weight?: number;
  height?: number;
  recordedBy: string;
}

export interface MedicalEncounter {
  _id: string;
  patientId: string;
  date: string;
  doctorName: string;
  reasonToVisit: string;
  remarks: string;

  vitals?: {
    bloodPressure: string;
    pulseRate: number;
    temperature: number;
    weight?: number;
    height?: number;
    sugar?: number;
  };

  prescriptions?: Array<{
    name: string;
    frequency: string;
    duration: string;
    instruction: string;
  }>;

  requestedLabs?: string[];
}

export async function linkPatientAadhaar(
  patientId: string,
  aadhaarId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    const sanitizedAadhaar = aadhaarId.replace(/\s/g, "");
    if (!/^\d{12}$/.test(sanitizedAadhaar)) {
      return {
        success: false,
        message:
          "Invalid format. Aadhaar must contain exactly 12 numeric digits.",
      };
    }
    await db
      .collection("patients")
      .updateOne(
        { _id: new ObjectId(patientId) },
        {
          $set: {
            abhaId: sanitizedAadhaar,
            abhaLinked: true,
            updatedAt: new Date(),
          },
        },
      );
    return {
      success: true,
      message: "Aadhaar verified and linked successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: "Database transactional override failed.",
    };
  }
}

export async function fetchPatients(
  searchQuery?: string,
): Promise<{ success: boolean; data: PatientRecord[] }> {
  try {
    const { db } = await connectToDatabase();
    let filter: any = {};
    if (searchQuery) {
      filter = {
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { mrn: { $regex: searchQuery, $options: "i" } },
          { phone: { $regex: searchQuery, $options: "i" } },
        ],
      };
    }
    const patients = await db
      .collection("patients")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    return {
      success: true,
      data: patients.map((doc) => ({ ...doc, _id: doc._id.toString() })) as any,
    };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function registerPatient(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    const sequenceToken = Math.floor(1000 + Math.random() * 9000);
    const generatedMrn = `IDHN-${new Date().getFullYear()}-${sequenceToken}`;

    const newPatient = {
      name: formData.get("name") as string,
      age: parseInt(formData.get("age") as string),
      gender: formData.get("gender") as string,
      phone: formData.get("phone") as string,
      abhaId: formData.get("abhaId") as string,
      mrn: generatedMrn,
      abhaLinked: !!formData.get("abhaId"),
      lastVisit: new Date().toLocaleDateString("en-GB"),
      assignedDoctor: formData.get("assignedDoctor") as string,
      createdAt: new Date(),
    };

    await db.collection("patients").insertOne(newPatient);
    return { success: true, message: "Patient logged successfully!" };
  } catch (error) {
    return { success: false, message: "Database write exception encountered." };
  }
}

export async function submitNursingVitals(
  vitals: Omit<PatientVitals, "_id">,
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    await db.collection("vitals").insertOne({
      ...vitals,
      pulseRate: Number(vitals.pulseRate),
      temperature: Number(vitals.temperature),
      createdAt: new Date(),
    });
    return { success: true, message: "Vitals committed successfully." };
  } catch (error) {
    return { success: false, message: "Database write error." };
  }
}


export async function fetchPatientClinicalHistory(
  patientIdentifier: string,
): Promise<{
  success: boolean;
  vitalsHistory: PatientVitals[];
  encounters: MedicalEncounter[];
}> {
  try {
    const { db } = await connectToDatabase();
    const patient = await db.collection("patients").findOne({
      $or: [
        { mrn: patientIdentifier },
        ...(ObjectId.isValid(patientIdentifier)
          ? [{ _id: new ObjectId(patientIdentifier) }]
          : []),
      ],
    });

    if (!patient) {
      return { success: false, vitalsHistory: [], encounters: [] };
    }
    const queryIds = [patient._id.toString(), patient.mrn];
    if (patient.abhaId) queryIds.push(patient.abhaId); // Just in case!

    const vitalsDocs = await db
      .collection("vitals")
      .find({ patientId: { $in: queryIds } })
      .sort({ createdAt: -1 })
      .toArray();

    const encounterDocs = await db
      .collection("encounters")
      .find({ patientId: { $in: queryIds } })
      .sort({ timestamp: -1 })
      .toArray();

    return {
      success: true,
      vitalsHistory: vitalsDocs.map((d) => ({
        ...d,
        _id: d._id.toString(),
      })) as any,
      encounters: encounterDocs.map((d) => ({
        ...d,
        _id: d._id.toString(),
      })) as any,
    };
  } catch (error) {
    console.error("Failed to pull historic profile reports:", error);
    return { success: false, vitalsHistory: [], encounters: [] };
  }
}
