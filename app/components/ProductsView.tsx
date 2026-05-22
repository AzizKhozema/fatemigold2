import { supabase } from "@/lib/supabase_client";
import SearchFilter from "@/app/components/SearchFilters";
import Link from "next/link";

// export const dynamic = 'force-dynamic';

// Produt filter is array of dropdowns we want to show in the UI. We will pass this to the "SEARCH FILTER" component
const PRODUCT_FILTERS = [
  {
    key: "type",
    label: "Type",
    options: [
      { label: "Metal", value: "metal" },
      { label: "Stone", value: "stone" },
      { label: "Consumable", value: "consumable" },
    ],
  },
  {
    key: "stock", // Example: filter by low stock
    label: "Stock Level",
    options: [
      { label: "In Stock", value: "available" },
      { label: "Low Stock", value: "low" },
    ],
  },
  {
    key: "metal", // Example: filter by low stock
    label: "Metal Type",
    options: [
      { label: "Gold", value: "gold" },
      { label: "Silver", value: "silver" },
    ],
  },
];

export async function ProductsView({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    type?: string;
    stock?: string;
    metal?: string;
  };
}) {
  // 1. OPEN THE ENVELOPE (The Transfer)
  const params = await searchParams;

  // 2. NOW extraction will work
  const query = params?.query || "";
  const typeFilter = params?.type || "";
  const stockFilter = params?.stock || "";
  const metalFilter = params?.metal || "";

  // for checking if the server receives the correct query and filters
  console.log(
    "THE SERVER SEES QUERY AS:",
    query,
    typeFilter,
    stockFilter,
    metalFilter,
  );

  // 2. Start the Query
  let dbQuery = supabase
    .from("products")
    .select("*")
    .eq("is_available", true);

  // FILTER LOGIC (Example: If query exists, add a search condition. Filters for database)

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  if (typeFilter) {
    dbQuery = dbQuery.ilike("type", typeFilter);
  }

  if (metalFilter) {
    dbQuery = dbQuery.ilike("metal", metalFilter);
  }

  // 6. Handle Stock Logic (Example: Low Stock is < 10)
  if (stockFilter === "low") {
    dbQuery = dbQuery.lt("stock", 10);
  } else if (stockFilter === "available") {
    dbQuery = dbQuery.gt("stock", 0);
    
  }

  // 6. Execute and Order
  const { data: products } = await dbQuery.order("name", { ascending: true });

  return (
    <>
      <div className="p-8 max-w-6xl mx-auto min-h-screen text-black">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Inventory</h1>
          <Link
            href="/products/new"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            + Add Item
          </Link>
        </div>

        {/* 5. Drop the Universal Component Here */}
        <SearchFilter
          placeholder="Search inventory by name..."
          filters={PRODUCT_FILTERS}
        />

        {/* 6. Render Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products?.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg border shadow-sm"
            >
              <h3 className="font-bold text-lg">{item.name}</h3>
              <div className="text-sm text-gray-500 mt-1 capitalize">
                {item.type}
              </div>
              {/* ... other details ... */}
            </div>
          ))}

          {products?.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
              No items found matching
            </div>
          )}
        </div>
      </div>
    </>
  );
}
