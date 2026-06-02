"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Record {
  _id: string;
  createdAt: string;
  filename: string;
  diagnosis: string;
  confidence: number;
  riskLevel: string;
}

type FetchStatus = "loading" | "error" | "success";

export default function HistoryPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");

  const fetchHistory = async () => {
    setStatus("loading");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
        setStatus("success");
      } else {
        console.error("Failed to fetch history: server responded with", response.status);
        setStatus("error");
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <main className="flex-grow py-16 px-6">
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in-up">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Patient History
            </h1>
            <p className="text-slate-500 font-medium">
              Review and manage past retina diagnostic reports.
            </p>
          </div>
          <Link href="/upload" className="clinical-btn !py-2.5 shadow-sm">
            New Analysis
          </Link>
        </div>

        <div className="clinical-card overflow-hidden">
          {/* Loading state */}
          {status === "loading" && (
            <div className="p-20 text-center text-slate-400 font-bold">
              Syncing with Clinical Database...
            </div>
          )}

          {/* Connection error state — separated from empty state */}
          {status === "error" && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-16 flex flex-col items-center text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-black text-slate-800 tracking-tight">
                  Database Connection Failed
                </p>
                <p className="text-sm font-medium text-slate-500 max-w-sm">
                  Could not retrieve patient records. This is a temporary server
                  issue — your data has not been lost. Please retry in a moment.
                </p>
              </div>
              <button
                onClick={fetchHistory}
                className="clinical-btn !py-2.5 !px-8 flex items-center gap-2 shadow-sm"
                aria-label="Retry fetching patient history"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry Connection
              </button>
            </div>
          )}

          {/* Truly empty state — only shown when the server confirmed 0 records */}
          {status === "success" && records.length === 0 && (
            <div className="p-20 text-center space-y-6">
              <p className="text-slate-400 font-medium text-lg">
                No records found in the database.
              </p>
              <Link href="/upload" className="clinical-link">
                Perform your first scan →
              </Link>
            </div>
          )}

          {/* Records table — unchanged */}
          {status === "success" && records.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Date &amp; Time
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      File Reference
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Diagnosis
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Confidence
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {records.map((record) => (
                    <tr
                      key={record._id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6 text-sm font-bold text-slate-500">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-sm font-black text-slate-800">
                        {record.filename}
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            record.diagnosis === "Healthy"
                              ? "bg-accent-primary/10 text-accent-primary"
                              : "bg-accent-warning/10 text-accent-warning"
                          }`}
                        >
                          {record.diagnosis}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-primary"
                              style={{ width: `${record.confidence}%` }}
                              role="progressbar"
                              aria-valuenow={record.confidence}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Confidence: ${record.confidence}%`}
                            ></div>
                          </div>
                          <span className="text-xs font-black text-slate-400">
                            {record.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => {
                            sessionStorage.setItem(
                              "lastAnalysis",
                              JSON.stringify(record)
                            );
                            window.location.href = "/result";
                          }}
                          className="text-[10px] font-black uppercase text-accent-primary hover:text-accent-hover focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-2 tracking-widest opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                          aria-label={`View report for ${record.filename}`}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
