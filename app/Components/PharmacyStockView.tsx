"use client";

import React, { useState } from "react";
import {
  MedicineItem,
  addNewMedicine,
  adjustStockCount,
  deleteMedicine,
} from "@/app/actions";

interface PharmacyStockViewProps {
  inventory: MedicineItem[];
  onRefresh: () => void;
}

export default function PharmacyStockView({
  inventory,
  onRefresh,
}: PharmacyStockViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);

  // PATCH: Client-side Search Input State Management
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleAddStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormMsg(null);
    setLoading(true);

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    try {
      const res = await addNewMedicine(formData);
      setLoading(false);
      if (res.success) {
        setFormMsg("🎉 Added to stock ledger.");
        formElement.reset();
        onRefresh();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setFormMsg(null);
        }, 1300);
      } else {
        setFormMsg("❌ Failed to save entry.");
      }
    } catch (err) {
      setLoading(false);
      setFormMsg("❌ Database exception encountered.");
    }
  };

  const handleInlineEditSave = async (id: string) => {
    const res = await adjustStockCount(id, editQty);
    if (res.success) {
      setEditingId(null);
      onRefresh();
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    const confirmPurge = confirm(
      `⚠️ Critical Action: Are you sure you want to permanently delete "${name}" from the system cluster records?`,
    );
    if (confirmPurge) {
      const res = await deleteMedicine(id);
      if (res.success) {
        onRefresh();
      } else {
        alert(res.message);
      }
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(query) ||
      item.batchNumber.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4 w-full">
      {/* Dynamic Action Header Trigger Context Line */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 border border-[#eadecc] rounded-2xl shadow-sm gap-4">
        {/* PATCH: Interactive Search Input Bar element */}
        <div className="relative flex-1 max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            🔍
          </div>
          <input
            type="text"
            placeholder="Search medicine name or batch number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-[#0f6266] transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#e2a83b] hover:bg-[#c9922f] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer self-end sm:self-auto shadow-sm"
        >
          + Add New Medicine
        </button>
      </div>

      {/* Main Grid Inventory Table */}
      <div className="bg-white border border-[#eadecc] rounded-2xl shadow-sm overflow-hidden w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fcfaf4] border-b border-[#eadecc] text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              <th className="p-4">Medicine Specifications</th>
              <th className="p-4">Batch / Expiry</th>
              <th className="p-4">Unit Rate</th>
              <th className="p-4">Live Stock Available</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-600">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  No matching therapeutic records found in this inventory view
                  block.
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 font-bold text-[#0e1e38]">{item.name}</td>
                  <td className="p-4 font-mono text-gray-400">
                    B: {item.batchNumber}
                    <span className="block text-[10px] font-sans font-medium text-red-400 mt-0.5">
                      Exp: {item.expiryDate}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-700">
                    ₹{item.pricePerUnit.toFixed(2)}
                  </td>
                  <td className="p-4">
                    {editingId === item._id ? (
                      <input
                        type="number"
                        defaultValue={item.stockCount}
                        onChange={(e) => setEditQty(Number(e.target.value))}
                        className="w-20 bg-slate-50 border border-[#eadecc] p-1 rounded font-mono focus:outline-none text-slate-800"
                      />
                    ) : (
                      <span
                        className={`font-mono px-2 py-0.5 rounded-md font-bold ${item.stockCount > 50 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
                      >
                        {item.stockCount} units
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {editingId === item._id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleInlineEditSave(item._id!)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[11px] cursor-pointer shadow-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-gray-400 hover:bg-gray-500 text-white font-bold px-2 py-1 rounded text-[11px] cursor-pointer shadow-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setEditingId(item._id!);
                            setEditQty(item.stockCount);
                          }}
                          className="border border-[#0f6266] text-[#0f6266] hover:bg-[#0f6266] hover:text-white font-bold px-2.5 py-1 rounded text-[11px] cursor-pointer transition-all"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteClick(item._id!, item.name)
                          }
                          className="text-red-400 hover:text-red-600 font-bold px-1.5 py-0.5 text-xs border border-transparent hover:border-red-200 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pop-up Entry Modal Layer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[2500]">
          <div className="bg-white rounded-2xl p-8 border border-[#eadecc] w-full max-w-md shadow-2xl relative text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-[#0e1e38] font-serif mb-1">
              Add New Medicine
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Onboard a brand new therapeutic batch allocation to local server
              memory.
            </p>

            {formMsg && (
              <div className="p-2.5 mb-4 text-xs font-bold text-center bg-slate-50 border rounded-xl text-teal-600">
                {formMsg}
              </div>
            )}

            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Item Brand Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Paracetamol 650mg"
                  className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Batch *
                  </label>
                  <input
                    type="text"
                    name="batchNumber"
                    required
                    placeholder="PCM-2026"
                    className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Expiry *
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    required
                    placeholder="12/2028"
                    className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="stockCount"
                    required
                    placeholder="500"
                    className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Rate (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="pricePerUnit"
                    required
                    placeholder="2.50"
                    className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Tablet per Pack *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="tabletsPerPack"
                    required
                    placeholder="20"
                    className="w-full bg-[#fcfaf4] border border-[#eadecc] rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border rounded-lg text-xs font-bold text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#0f6266] text-white font-bold text-xs rounded-lg"
                >
                  {loading ? "Adding..." : "Onboard Supply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
