"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase_client";
import DateAndTime from "./DateAndTime";
import CustomerSearch from "./CutomerSearch";

interface Customer {
  id: string;
  name: string;
  phone_no_1: string;
}

export default function NewOrderFrom({ nextSerial }: { nextSerial: number }) {
  // 1. MAIN FORM STATE
  const [orderType, setOrderType] = useState("order");
  //   const [<DateAndTme />, set<DateAndTme />] = useState("");
  //   const [isFocused, setIsFocused] = useState(false);
  //   const [suggestions, setSuggestions] = useState<Customer[]>([]);

  // 2. DATA CAPTURE STATE
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // All form inputs stored in one object
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    productName: "",
    estimatePrice: "",
    estimateWeight: "",
    stone: "",
    polish: "",
    productSN: "",
    advanceRs: "",
    ringSize: "",
    bangleSize: "",
    braceletSize: "",
    metal: "21k Gold", // Default value
  });

  // Handle Input Changes for all fields
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Search Logic
  //   useEffect(() => {
  //     const searchCustomers = async () => {
  //       if (customerSearch.length < 0 || selectedCustomer || !isFocused) {
  //         setSuggestions([]);
  //         return;
  //       }
  //       const { data, error } = await supabase
  //         .from("customers")
  //         .select("id, name, phone_no_1")
  //         .ilike("name", `%${customerSearch}%`);

  //       if (!error) setSuggestions(data || []);
  //     };

  //     const delay = setTimeout(searchCustomers, 300);
  //     return () => clearTimeout(delay);
  //   }, [customerSearch, selectedCustomer, isFocused]);

  // Handle Selecting a Customer
  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setSuggestions([]);

    // Auto-fill form fields with customer data
    setFormData((prev) => ({
      ...prev,
      customerName: customer.name,
      phone: customer.phone_no_1,
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 animate-in fade-in duration-500">
      {/* --- HEADER SECTION --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-100 p-3 rounded-2xl text-center text-sm font-medium text-gray-600 flex items-center justify-center">
          <DateAndTime />
        </div>

        <div className="bg-gray-800 text-white p-3 rounded-2xl text-center font-mono font-bold flex items-center justify-center">
          SN: {nextSerial.toString().padStart(4, "0")}
        </div>
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="bg-gray-100 p-3 rounded-2xl text-center outline-none ring-purple-300 focus:ring-2 capitalize cursor-pointer"
        >
          <option value="order">New Order</option>
          <option value="repairing">Repairing</option>
          <option value="valuation">Valuation</option>
        </select>
      </div>

      {/* --- CUSTOMER SEARCH BAR --- */}
      <div className="relative group">
        <CustomerSearch />
      </div>

      {/* --- DYNAMIC FORM FIELDS --- */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-6 font-bold">
          {orderType} Details
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* We define our fields array here to map them easily */}
          {[
            { id: "customerName", label: "Full Name" },
            { id: "phone", label: "Phone Number" },
            { id: "productName", label: "Item Name" },
            { id: "productSN", label: "Product SN" },
            { id: "estimatePrice", label: "Est. Price" },
            { id: "estimateWeight", label: "Est. Weight" },
            { id: "advanceRs", label: "Advance Paid" },
            { id: "metal", label: "Metal Type" },
            { id: "ringSize", label: "Ring Size" },
            { id: "stone", label: "Stone Details" },
            { id: "polish", label: "Polish Type" },
            { id: "braceletSize", label: "Bracelet Size" },
          ].map((field) => (
            <div key={field.id} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                {field.label}
              </label>
              <input
                placeholder={field.label}
                value={formData[field.id as keyof typeof formData]}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="bg-gray-50 p-3 rounded-xl text-sm border border-transparent focus:border-purple-200 focus:bg-white outline-none transition-all"
              />
            </div>
          ))}
        </div>

        {/* --- ACTIONS --- */}
        <div className="mt-10 flex gap-4">
          <button
            className="flex-1 bg-purple-600 text-white font-bold py-4 rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-100"
            onClick={() => console.log("Saving data:", formData)}
          >
            Create {orderType}
          </button>
          <button
            onClick={() => {
              setCustomerSearch("");
              setSelectedCustomer(null);
              setFormData({
                ...formData,
                customerName: "",
                phone: "",
                productName: "",
              });
            }}
            className="px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-400 transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
