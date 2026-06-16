"use client";

import React, { useState } from "react";
import { MedicineItem, executeDispensation } from "../actions";

interface BasketItem extends MedicineItem {
  dispenseQty: number;
}

interface PharmacyDispenseViewProps {
  inventory: MedicineItem[];
  onRefresh: () => void;
}

export default function PharmacyDispenseView({
  inventory,
  onRefresh,
}: PharmacyDispenseViewProps) {
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const addToBasket = (item: MedicineItem) => {
    if (item.stockCount <= 0)
      return alert("Cannot dispense out-of-stock items.");
    const existing = basket.find((b) => b._id === item._id);
    if (existing) {
      if (existing.dispenseQty >= item.stockCount)
        return alert("Maximum available stock exceeded.");
      setBasket(
        basket.map((b) =>
          b._id === item._id ? { ...b, dispenseQty: b.dispenseQty + 1 } : b,
        ),
      );
    } else {
      setBasket([...basket, { ...item, dispenseQty: 1 }]);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(query) ||
      item.batchNumber.toLowerCase().includes(query)
    );
  });

  const updateBasketQty = (id: string, qty: number, maxStock: number) => {
    if (qty > maxStock) return alert("Insufficient stock values available.");
    if (qty <= 0) {
      setBasket(basket.filter((b) => b._id !== id));
    } else {
      setBasket(
        basket.map((b) => (b._id === id ? { ...b, dispenseQty: qty } : b)),
      );
    }
  };

  const grandTotal = basket.reduce(
    (acc, b) => acc + b.dispenseQty * b.pricePerUnit,
    0,
  );

  const handleCheckoutDispense = async () => {
    if (basket.length === 0)
      return alert("Your dispensing basket is completely empty.");

    const checkoutItems = basket.map((b) => ({
      id: b._id!,
      name: b.name,
      quantity: b.dispenseQty,
      totalPrice: b.dispenseQty * b.pricePerUnit,
    }));

    const res = await executeDispensation(
      "WALK-IN-PATIENT",
      checkoutItems,
      grandTotal,
    );
    if (res.success) {
      alert(res.message);
      setBasket([]);
      onRefresh();
    }
  };

  return (
    <div className="">
      {/* Search for medicine */}

      {/* Left Hand: Selection Grid Catalog */}
      <div className="lg:col-span-3 bg-white border border-[#eadecc] rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold font-serif text-[#0e1e38] mb-2">
          Available Therapeutics Catalog
        </h3>
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
        {/* Container layout rendering the catalog with conditional expansion */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(searchQuery.trim() !== ""
            ? filteredInventory
            : filteredInventory.slice(0, 2)
          ).map((item) => (
            <div
              key={item._id}
              className="p-4 bg-[#fcfaf4] border border-[#eadecc]/60 rounded-xl flex justify-between items-center shadow-sm animate-in fade-in duration-150"
            >
              <div>
                <h4 className="font-bold text-xs text-[#0e1e38]">
                  {item.name}
                </h4>
                <p className="text-[10px] text-gray-400 font-medium">
                  Stock: {item.stockCount} units •  Tablets : {item.tabletsPerPack} •
                  Rate: ₹{item.pricePerUnit.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => addToBasket(item)}
                disabled={item.stockCount <= 0}
                className="bg-[#0f6266] text-white font-bold text-[11px] px-3 py-1.5 rounded-lg disabled:bg-slate-300 transition-colors cursor-pointer"
              >
                + Dispense
              </button>
            </div>
          ))}
          {!searchQuery.trim() && filteredInventory.length > 2 && (
            <div className="sm:col-span-2 text-center pt-2">
              <p className="text-[10px] text-gray-400 italic">
                Showing top 2 default items. Use the search option bar above to
                display more therapeutics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Hand Sidebar: Automated Bill Invoice Calculator */}
      <div className="lg:col-span-2 bg-white border border-[#eadecc] rounded-2xl p-6 shadow-sm flex flex-col justify-between h-fit space-y-6">
        <div>
          <h3 className="text-sm font-bold font-serif text-[#0e1e38] border-b border-gray-150 pb-2.5 mb-4">
            Dispensing Summary Basket
          </h3>
          {basket.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">
              No medications staged for verification.
            </p>
          ) : (
            <div className="space-y-3 divide-y divide-gray-100/60 max-h-64 overflow-y-auto pr-1">
              {basket.map((b) => (
                <div
                  key={b._id}
                  className="flex justify-between items-center pt-2.5 first:pt-0 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#0e1e38]">{b.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      ₹{b.pricePerUnit} |  {b.dispenseQty}  | {b.tabletsPerPack}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={b.dispenseQty}
                      onChange={(e) =>
                        updateBasketQty(
                          b._id!,
                          Number(e.target.value),
                          b.stockCount,
                        )
                      }
                      className="w-12 bg-slate-50 border border-gray-200 rounded p-1 text-center font-mono text-xs focus:outline-none"
                    />
                    <button
                      onClick={() => updateBasketQty(b._id!, 0, b.stockCount)}
                      className="text-red-400 hover:text-red-600 font-bold px-1 text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-[#eadecc] pt-4 space-y-3.5">
          <div className="flex justify-between items-center text-xs font-medium text-gray-400">
            <span>Total Pharmacy Cost Summary</span>
            <span className="font-mono font-bold text-slate-700 text-sm">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold text-[#0e1e38] bg-[#fcfaf4] p-3 rounded-xl border border-[#eadecc]/60">
            <span>Grand Aggregate Bill Due</span>
            <span className="font-mono text-base text-emerald-600">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleCheckoutDispense}
            className="w-full bg-[#0f6266] text-white font-bold text-xs py-3 rounded-xl hover:bg-[#0b4a4d] transition-colors shadow-md cursor-pointer"
          >
            Execute Dispensation & Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
