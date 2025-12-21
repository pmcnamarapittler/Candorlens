import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

const App: React.FC = () => {
  return (
    <div className="p-4 text-base">
      <h1 className="text-xl font-semibold mb-2">CandorLens Extension</h1>
      <p className="text-sm text-gray-700">
        Frontend dev environment is working 🎉
      </p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
