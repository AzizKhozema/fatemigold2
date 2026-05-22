import { supabase } from "@/lib/supabase_client";
import { deleteOrder } from "@/app/orders/actions";
import { Search, Eye, Calendar } from "lucide-react";
import SearchFilter from "@/app/components/SearchFilters";
import Link from "next/link";

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

export async function OrdersView() {
  const { data: orders } = await supabase
    .from("orders")
    .select("*, customers (*)")
    .order("order_id", { ascending: true });

  const brokenOrders = orders?.filter((o) => !o.customers);
  if (brokenOrders?.length) {
    console.log(
      "Found orders without customers:",
      brokenOrders.map((o) => o.id),
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Shipped":
        return "bg-blue-100 text-blue-800";
      case "Pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <main className="flex flex-col justify-between h-screen p-2 pt-2 pb-2">
        {/* Header */}
        <header className="w-full h-20 flex justify-between items-center px-6">
          <div>
            <h2 className="text-gray-900 font-bold text-2xl  ">Orders</h2>
            <p className="text-gray-500 mt-1">
              Track and manage customer orders
            </p>
          </div>

          <div>
            <Link
              href="/orders/new"
              className="m-3 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition"
            >
              + New Order
            </Link>
          </div>
        </header>

        <article className="flex flex-col gap-2">
          {/* Filters */}
          <SearchFilter
            placeholder="Search inventory by name..."
            filters={PRODUCT_FILTERS}
          />

          {/* Orders Table */}
          <div className="bg-white rounded-xl border border-gray-200 h-170">
            <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:hidden] h-170 ">
              <table className="w-full ">
                <thead className="bg-gray-50 shadow-2xl shadow-black sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      type
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 overflow-scroll">
                  {orders?.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">
                            {order.customers?.name} {order.customers?.surname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Intl.NumberFormat("en-PK", {
                          style: "currency",
                          currency: "PKR",
                          minimumFractionDigits: 2,
                        }).format(order.price)}
                      </td>
                      <td
                        suppressHydrationWarning
                        className="px-6 py-4 text-sm text-gray-600"
                      >
                        {new Date(order.created_at).toISOString().split("T")[0]}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 w-20 justify-center text-xs rounded-full  ${getStatusColor(
                            order.status,
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <Link
                  href={`/orders/${order.id}`}
                  key={order.id}
                  className="hover:bg-gray-50"
                >
                    <td suppressHydrationWarning className="px-6 py-4">
                    <button className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1 hover:bg-gray-50 px-2 py-1 rounded cursor-pointer">
                    <Eye className="w-4 h-4 "  />
                    View
                    </button>
                    </td>
                    </Link>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <footer className="grid m-2 grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Summary */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-gray-500 text-sm">Total Orders</p>
            <p className="text-gray-900 mt-1">1,234</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-gray-900 mt-1">45</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-gray-500 text-sm">Processing</p>
            <p className="text-gray-900 mt-1">128</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-gray-900 mt-1">1,061</p>
          </div>
        </footer>
      </main>
    </>
  );
}
