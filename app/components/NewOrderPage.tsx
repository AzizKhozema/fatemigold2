import Link from "next/link";
import NewOrderFrom from "./NewOrderForm";


export default function NewOrderPage() {
  return (
    <main className="flex flex-col justify-between h-screen p-2 pt-2 pb-2 ">

      <header className="w-full h-20 flex justify-between items-center px-6">
        <div>
          <h2 className="text-gray-900 font-bold text-2xl  ">
            Create New Orders
          </h2>
          <p className="text-gray-500 mt-1">Add orders</p>
        </div>

        <div>
          <Link
            href="/orders"
            className="m-3 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition"
          >
            Back to Orders
          </Link>
        </div>
      </header>

      <article>
        <NewOrderFrom nextSerial={1} />



      </article>
      
      <footer>
      </footer>
    </main>
  );
}
