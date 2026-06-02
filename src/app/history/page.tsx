"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

interface Record {
  _id: string;
  createdAt: string;
  filename: string;
  diagnosis: string;
  confidence: number;
  riskLevel: string;
}

function HistoryTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {["Date & Time", "File Reference", "Diagnosis", "Confidence", "Action"].map((col) => (
              <th key={col} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 bg-white">
          {Array.from({ length: 7 }).map((_, i) => (
            <tr key={i}>
              {/* Date & Time */}
              <td className="px-8 py-6">
                <Skeleton className="h-3.5 w-36" />
              </td>
              {/* File Reference */}
              <td className="px-8 py-6">
                <Skeleton className="h-3.5 w-44" />
              </td>
              {/* Diagnosis badge */}
              <td className="px-8 py-6">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              {/* Confidence bar + number */}
              <td className="px-8 py-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-1.5 w-20 rounded-full" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </td>
              {/* Action button */}
              <td className="px-8 py-6 flex justify-end">
                <Skeleton className="h-3.5 w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HistoryPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/history`);
        if (response.ok) {
          const data = await response.json();
          setRecords(data);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <main className="flex-grow py-16 px-6">
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in-up">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Patient History</h1>
            <p className="text-slate-500 font-medium">Review and manage past retina diagnostic reports.</p>
          </div>
          <Link href="/upload" className="clinical-btn !py-2.5 shadow-sm">
            New Analysis
          </Link>
        </div>

        <div className="clinical-card overflow-hidden">
          {loading ? (
            <HistoryTableSkeleton />
          ) : records.length === 0 ? (
            <div className="p-20 text-center space-y-6">
               <p className="text-slate-400 font-medium text-lg">No records found in the database.</p>
               <Link href="/upload" className="clinical-link">Perform your first scan →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">File Reference</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnosis</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Confidence</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {records.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6 text-sm font-bold text-slate-500">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-sm font-black text-slate-800">
                        {record.filename}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          record.diagnosis === 'Healthy' 
                            ? 'bg-accent-primary/10 text-accent-primary' 
                            : 'bg-accent-warning/10 text-accent-warning'
                        }`}>
                          {record.diagnosis}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="flex-1 w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent-primary" 
                                style={{ width: `${record.confidence}%` }}
                              ></div>
                           </div>
                           <span className="text-xs font-black text-slate-400">{record.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => {
                            sessionStorage.setItem("lastAnalysis", JSON.stringify(record));
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
