import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase_client";

interface Customer {    
    id: string;
    name: string;
    phone_no_1: string;
}

export default function CustomerSearch() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length < 0 || selectedCustomer || !isFocused) {
        setSuggestions([]);
        return;
      }
        const { data, error } = await supabase
            .from("customers")
            .select("id, name, phone_no_1")
            .ilike("name", `%${customerSearch}%`);

        if (!error) setSuggestions(data || []);
    };

    const delay = setTimeout(searchCustomers, 300);
    return () => clearTimeout(delay);
  }, [customerSearch, selectedCustomer, isFocused]);

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setSuggestions([]);
  };    
    return (
<>

<input
          placeholder="Type customer name to search..."
          value={customerSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={(e) => {
            setCustomerSearch(e.target.value);
            if (selectedCustomer) setSelectedCustomer(null); // Reset if they start typing again
        }}
        className={`w-full p-5 text-center rounded-2xl outline-none transition-all border-2 ${
            selectedCustomer ? "border-green-400 bg-green-50" : "border-transparent bg-gray-100 focus:bg-white focus:border-purple-300"
        } font-bold text-lg`}
        />
        
        {/* Dropdown Results */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute z-50 max-h-70 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {suggestions.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className="w-full p-4 flex justify-between items-center hover:bg-purple-50 transition-colors border-b last:border-0 border-gray-50"
              >
                <span className="font-bold text-gray-700">{c.name}</span>
                <span className="text-xs font-mono text-purple-500 bg-purple-50 px-3 py-1 rounded-full">
                  {c.phone_no_1}
                </span>
              </button>
            ))}
          </div>
        )}
        </>
    );
}