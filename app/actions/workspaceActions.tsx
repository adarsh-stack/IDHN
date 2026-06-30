"use server";

import { connectToDatabase } from "../lib/db";
import { ObjectId } from "mongodb";

export async function searchPharmacyInventory(
  query: string,
): Promise<{ success: boolean; data: any[] }> {
  try {
    if (!query || query.trim().length < 2) return { success: true, data: [] };
    const { db } = await connectToDatabase();
    const items = await db
      .collection("pharmacy_inventory")
      .find({ name: { $regex: query, $options: "i" } })
      .limit(8)
      .toArray();

    return {
      success: true,
      data: items.map((item) => ({
        _id: item._id.toString(),
        name: item.name,
        stock: item.stockCount,
        type: item.category || "Medicine",
        pricePerUnit: item.pricePerUnit,
      })),
    };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function fetchPatientDetails(
  patientId: string,
): Promise<{ success: boolean; data: any }> {
  try {
    const { db } = await connectToDatabase();
    const patient = await db.collection("patients").findOne({
      $or: [
        { mrn: patientId },
        { abhaId: patientId },
        ...(ObjectId.isValid(patientId)
          ? [{ _id: new ObjectId(patientId) }]
          : []),
      ],
    });

    if (!patient) return { success: false, data: null };
    return {
      success: true,
      data: {
        _id: patient._id.toString(),
        mrn: patient.mrn,
        name: patient.name,
        phone: patient.phone || "N/A",
        age: patient.age || "--",
        gender: patient.gender || "Unknown",
        bloodGroup: patient.bloodGroup || "Not Recorded",
      },
    };
  } catch (error) {
    return { success: false, data: null };
  }
}

export async function fetchLatestVitals(
  patientId: string,
): Promise<{ success: boolean; data: any }> {
  try {
    const { db } = await connectToDatabase();
    const patientRes = await fetchPatientDetails(patientId);
    const queryIds = [patientId];
    if (patientRes.success && patientRes.data) {
      queryIds.push(patientRes.data._id);
      queryIds.push(patientRes.data.mrn);
    }

    const latestVital = await db
      .collection("vitals")
      .find({ patientId: { $in: queryIds } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(1)
      .toArray();

    if (latestVital.length === 0) return { success: false, data: null };

    return {
      success: true,
      data: {
        bloodPressure: latestVital[0].bloodPressure,
        pulseRate: latestVital[0].pulseRate,
        temperature: latestVital[0].temperature,
        weight: latestVital[0].weight,
        sugar: latestVital[0].sugar,
        date:
          latestVital[0].date ||
          new Date(latestVital[0].createdAt).toLocaleTimeString(),
      },
    };
  } catch (error) {
    return { success: false, data: null };
  }
}

export async function saveWorkspaceDraft(
  payload: any,
): Promise<{ success: boolean }> {
  try {
    const { db } = await connectToDatabase();
    await db
      .collection("workspace_drafts")
      .updateOne(
        { patientId: payload.patientId },
        { $set: { ...payload, updatedAt: new Date() } },
        { upsert: true },
      );
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function loadWorkspaceDraft(
  patientId: string,
): Promise<{ success: boolean; data: any }> {
  try {
    const { db } = await connectToDatabase();
    const draft = await db
      .collection("workspace_drafts")
      .findOne({ patientId });
    if (!draft) return { success: false, data: null };
    return { success: true, data: draft };
  } catch (error) {
    return { success: false, data: null };
  }
}

export async function logPatientEncounter(
  payload: any,
): Promise<{ success: boolean }> {
  try {
    const { db } = await connectToDatabase();

    await db.collection("encounters").insertOne({
      ...payload,
      date: new Date().toLocaleDateString("en-GB"),
      timestamp: new Date(),
    });

    await db
      .collection("workspace_drafts")
      .deleteOne({ patientId: payload.patientId });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function fetchPastEncounters(
  patientId: string,
): Promise<{ success: boolean; data: any[] }> {
  try {
    const { db } = await connectToDatabase();

    const patientRes = await fetchPatientDetails(patientId);
    const queryIds = [patientId];
    if (patientRes.success && patientRes.data) {
      queryIds.push(patientRes.data._id);
      queryIds.push(patientRes.data.mrn);
    }

    const encounters = await db
      .collection("encounters")
      .find({ patientId: { $in: queryIds } })
      .sort({ timestamp: -1 })
      .toArray();

    return {
      success: true,
      data: encounters.map((e) => ({ ...e, _id: e._id.toString() })),
    };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function updatePatientEncounter(
  encounterId: string,
  payload: any,
): Promise<{ success: boolean }> {
  try {
    const { db } = await connectToDatabase();
    await db
      .collection("encounters")
      .updateOne(
        { _id: new ObjectId(encounterId) },
        { $set: { ...payload, updatedAt: new Date() } },
      );
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
