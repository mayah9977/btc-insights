"use client";

export default function VIPControl() {
  return (
    <div className="bg-purple-900 p-4 rounded-xl mt-4">
      <h3 className="text-white font-bold">🎩 VIP Control</h3>

      <button className="mt-2 bg-red-600 px-4 py-2 rounded">
        FORCE ENTRY
      </button>

      <button className="mt-2 ml-2 bg-gray-700 px-4 py-2 rounded">
        DISABLE SIGNAL
      </button>
    </div>
  );
}
