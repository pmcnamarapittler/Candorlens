import React, { useState } from "react";

export default function Popup() {
  const [result, setResult] = useState<any>(null);

  async function sendTestRequest() {
    const res = await fetch("http://localhost:8000/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "chrome-extension://test",
        summary: "Popup test",
        labels: ["chrome", "extension"]
      })
    });

    const data = await res.json();
    setResult(data);
  }

  return (
    <div className="p-4 w-72">
      <h1 className="text-xl font-bold mb-2">CandorLens</h1>

      <button
        onClick={sendTestRequest}
        className="bg-blue-600 text-white px-3 py-2 rounded"
      >
        Send Test Report
      </button>

      {result && (
        <pre className="mt-3 text-xs bg-gray-100 p-2 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}