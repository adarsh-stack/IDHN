'use server';

import { connectToDatabase } from '../lib/db';
import { ObjectId } from 'mongodb';

export interface MedicineItem {
  _id?: string;
  name: string;
  batchNumber: string;
  stockCount: number;
  pricePerUnit: number;
  tabletsPerPack: number;
  expiryDate: string;
}

/**
 * 1. PULL INVENTORY LIST
 */
export async function fetchInventory(): Promise<{ success: boolean; data: MedicineItem[] }> {
  try {
    const { db } = await connectToDatabase();
    const items = await db.collection('pharmacy_inventory').find({}).sort({ name: 1 }).toArray();
    
    return {
      success: true,
      data: items.map(i => ({ ...i, _id: i._id.toString() })) as unknown as MedicineItem[]
    };
  } catch (error) {
    console.error('Failed to load pharmacy stock:', error);
    return { success: false, data: [] };
  }
}

/**
 * 2. ADD BRAND NEW INVENTORY RECORD
 */
export async function addNewMedicine(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    
    const name = formData.get('name') as string;
    const batchNumber = formData.get('batchNumber') as string;
    const tabletsPerPack = parseInt(formData.get('tabletsPerPack') as string)||0;
    const stockCount = parseInt(formData.get('stockCount') as string) || 0;
    const pricePerUnit = parseFloat(formData.get('pricePerUnit') as string) || 0;
    const expiryDate = formData.get('expiryDate') as string;

    await db.collection('pharmacy_inventory').insertOne({
      name,
      batchNumber,
      stockCount,
      pricePerUnit,
      tabletsPerPack,
      expiryDate,
      createdAt: new Date()
    });

    return { success: true, message: 'Medicine loaded to local node inventory.' };
  } catch (error) {
    console.error('Failed to create stock record:', error);
    return { success: false, message: 'Database transaction error.' };
  }
}

/**
 * 3. UPDATE AN EXISTING ITEM'S ABSOLUTE QUANTITY
 */
export async function adjustStockCount(medicineId: string, newQuantity: number): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('pharmacy_inventory').updateOne(
      { _id: new ObjectId(medicineId) },
      { $set: { stockCount: Number(newQuantity) } }
    );
    return { success: true, message: 'Stock adjustments updated successfully.' };
  } catch (error) {
    console.error('Stock modifier crashed:', error);
    return { success: false, message: 'Failed to modify inventory logs.' };
  }
}

/**
 * 4. DISPENSE MEDICINES AND AUTO-UPDATE STOCK COUNTERS VIA ATOMIC OPERATORS
 * Uses $inc with negative numbers to atomically subtract stock and avoid race conditions.
 */
export async function executeDispensation(patientId: string, items: Array<{ id: string; name: string; quantity: number; totalPrice: number }>, grandTotal: number): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();

    // Loop through and deduct stock counts atomically
    for (const item of items) {
      await db.collection('pharmacy_inventory').updateOne(
        { _id: new ObjectId(item.id) },
        { $inc: { stockCount: -Math.abs(item.quantity) } } // Safe subversion drop
      );
    }

    // Record invoice ticket into centralized hospital accounting stream
    const billResult = await db.collection('bills').insertOne({
      patientId,
      type: 'Pharmacy',
      amount: grandTotal,
      status: 'unpaid',
      items: items.map(i => ({ description: i.name, qty: i.quantity, total: i.totalPrice })),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { success: true, message: `Dispensation processed. Invoice #${billResult.insertedId.toString().substring(18)} generated.` };
  } catch (error) {
    console.error('Dispensation pipeline failed:', error);
    return { success: false, message: 'Transactional dispatch failure.' };
  }
}


/**
 * 5. PURGE MEDICINE RECORD
 * Deletes a medical stock profile permanently matching its ObjectID index
 */
export async function deleteMedicine(medicineId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await connectToDatabase();
    
    const result = await db.collection('pharmacy_inventory').deleteOne({
      _id: new ObjectId(medicineId)
    });

    return result.deletedCount > 0
      ? { success: true, message: 'Therapeutic item successfully purged from inventory.' }
      : { success: false, message: 'Target batch profile index missing.' };
  } catch (error) {
    console.error('Delete transaction failed:', error);
    return { success: false, message: 'Database deletion request rejected.' };
  }
}