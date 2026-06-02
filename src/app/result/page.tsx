"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

interface AnalysisResult {
  _id?: string;
  diagnosis: string;
  confidence: number;
  risk_level: string;
  riskLevel?: string; // Handle both Python and MERN naming
  filename: string;
  observations: { label: string; value: string }[];
  localPreview?: string;
  heatmap?: string;
}

function ResultSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Report Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-12 w-36 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Main card — lg:col-span-3 */}
        <div className="lg:col-span-3 clinical-card p-1">
          <div className="bg-white rounded-[12px] p-10 space-y-12">
 
            {/* Diagnosis status + right panel */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-12">
              {/* Left: diagnosis title + confidence bar */}
              <div className="space-y-4 flex-1">
                <Skeleton className="h-3 w-32" />        {/* "Diagnosis Status" label */}
                <Skeleton className="h-14 w-48" />       {/* Big diagnosis word */}
                <div className="pt-6 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-3 w-full rounded-full" /> {/* confidence bar */}
                </div>
              </div>
 
              {/* Right: severity card + scan preview */}
              <div className="w-full md:w-72 grid grid-cols-1 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-9 w-16" />
                </div>
                <Skeleton className="h-40 w-full rounded-2xl" /> {/* scan preview */}
              </div>
            </div>
 
            {/* Technical Observations */}
            <div className="border-t border-slate-50 pt-10 space-y-8">
              <Skeleton className="h-6 w-52" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Observation rows */}
                <div className="space-y-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-slate-50">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))}
                </div>
                {/* Heatmap placeholder */}
                <Skeleton className="h-64 w-full rounded-3xl" />
              </div>
            </div>
 
            {/* Explanation section */}
            <div className="border-t border-slate-50 pt-10 space-y-6">
              <Skeleton className="h-6 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-4/6" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
 
        {/* Recommendations sidebar — lg:col-span-1 */}
        <div className="lg:col-span-1 clinical-card p-1">
          <div className="bg-slate-900 rounded-[12px] p-8 space-y-10">
            <Skeleton className="h-14 w-14 rounded-2xl bg-slate-700" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-40 bg-slate-700" />
              <Skeleton className="h-3 w-full bg-slate-700" />
              <Skeleton className="h-3 w-5/6 bg-slate-700" />
            </div>
            <div className="space-y-4 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-2 w-2 mt-1.5 rounded-full bg-slate-700 shrink-0" />
                  <Skeleton className="h-3 w-full bg-slate-700" />
                </div>
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-xl bg-slate-700 mt-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

useEffect(() => {
  const data = sessionStorage.getItem("lastAnalysis");
  setResult(data ? JSON.parse(data) : null);
}, []);

  const handleExportPDF = () => {
    if (result?._id) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        window.location.href = `${apiUrl}/api/report/${result._id}`;
    }
  };

  if (!result) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <ResultSkeleton />
      </main>
    );
  }

  const finalRiskLevel = result.riskLevel || result.risk_level;

  return (
    <main className="flex-grow py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in-up">
        {/* Report Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Diagnosis</h1>
              <p className="text-sm font-bold text-slate-600 uppercase tracking-[0.2em]">File: {result.filename} - V4.2</p>
           </div>
           <div className="flex gap-4 w-full md:w-auto">
              <button className="flex-1 md:flex-none px-8 py-3 bg-white text-slate-700 font-bold border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all" aria-label="Share clinical diagnosis report">
                 Share report
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex-1 md:flex-none clinical-btn !py-3 !px-10"
                aria-label="Export clinical diagnosis report as PDF"
              >
                 Export PDF
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
           {/* Main Observations */}
           <div className="lg:col-span-3 space-y-10">
              <div className="clinical-card p-1">
                 <div className="bg-white rounded-[12px] p-10 space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                       <div className="space-y-4 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnosis Status</p>
                          <h2 className={`text-5xl font-black leading-none ${result.diagnosis === 'Healthy' ? 'text-slate-900' : 'text-accent-warning'}`}>
                            {result.diagnosis}
                          </h2>
                          <div className="pt-6 space-y-3">
                             <div className="flex justify-between text-[11px] font-black uppercase text-accent-primary">
                                <span>Neural Confidence</span>
                                <span>{result.confidence}%</span>
                             </div>
                             <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-50">
                                <div 
                                  className="bg-accent-primary h-full rounded-full transition-all duration-1000 shadow-sm"
                                  style={{ width: `${result.confidence}%` }}
                                ></div>
                             </div>
                          </div>
                       </div>
                       
                       <div className="w-full md:w-72 grid grid-cols-1 gap-6">
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Severity Risk</p>
                             <p className={`text-3xl font-black leading-none ${finalRiskLevel === 'Low' ? 'text-accent-primary' : 'text-accent-warning'}`}>
                                {finalRiskLevel}
                             </p>
                          </div>
                          {result.localPreview && (
                            <div className="rounded-2xl border-2 border-slate-100 overflow-hidden shadow-inner bg-slate-50">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-3 pb-0">Scan Preview</p>
                              <img src={result.localPreview} alt={`Retina scan preview for ${result.filename}`} className="w-full h-32 object-cover" />
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="border-t border-slate-50 pt-10">
                       <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Technical Observations</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                             {result.observations.map((item) => (
                               <div key={item.label} className="flex justify-between items-center py-4 border-b border-slate-50">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                                  <span className="text-sm font-black text-slate-800">{item.value}</span>
                               </div>
                             ))}
                          </div>
                          
                          {/* AI Heatmap Visualization */}
                          {result.heatmap && (
                            <div className="space-y-4">
                               <div className="p-1 bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden shadow-inner group relative">
                                  <img 
                                    src={`data:image/jpeg;base64,${result.heatmap}`} 
                                    alt="AI Analysis Heatmap" 
                                    className="w-full h-64 object-cover rounded-[1.4rem] transition-transform duration-700 group-hover:scale-105" 
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent flex items-end p-6">
                                     <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Neural Activation Map (Grad-CAM)</p>
                                  </div>
                               </div>
                               <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic px-2">
                                  The highlighted &quot;heat&quot; zones indicate specific areas where the AI detected vascular irregularities or pathological markers.
                               </p>
                            </div>
                          )}
                       </div>
                    </div>

                    {/* Dynamic Explanation Section */}
                    <div className="border-t border-slate-50 pt-10">
                       <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">
                          {result.diagnosis === 'Healthy' ? 'Why your scan is Healthy' : 'Understanding Your Findings'}
                       </h3>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {result.diagnosis === 'Healthy' ? (
                            <div className="md:col-span-2 p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                               <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                  Our AI analyzed your retina and found no signs of vascular damage. A healthy retina shows clear, distinct blood vessels without any leaks, bulges, or fatty deposits. The central vision area (Macula) appears dark and clear, and the optic nerve is well-defined.
                               </p>
                               <p className="text-xs font-black text-accent-primary uppercase tracking-widest pt-2">
                                  No pathological markers detected.
                               </p>
                            </div>
                          ) : (
                            <>
                               {/* Check observations array for specific findings */}
                               {result.observations.some(obs => obs.value.includes('Microaneurysms')) && (
                                  <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50 space-y-2">
                                     <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider">Microaneurysms</h4>
                                     <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        Small &quot;bubbles&quot; or weak spots in tiny blood vessels. These are early indicators of pressure changes in the retina.
                                     </p>
                                  </div>
                               )}

                               {result.observations.some(obs => obs.value.includes('Hemorrhages')) && (
                                  <div className="p-5 rounded-2xl bg-red-50/50 border border-red-100/50 space-y-2">
                                     <h4 className="text-sm font-black text-red-900 uppercase tracking-wider">Hemorrhages</h4>
                                     <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        Tiny leaks where blood has escaped from a vessel. Think of it as a small &quot;drip&quot; from a weak spot.
                                     </p>
                                  </div>
                               )}

                               {result.observations.some(obs => obs.value.includes('Exudates')) && (
                                  <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100/50 space-y-2">
                                     <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider">Exudates</h4>
                                     <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        Fatty deposits left behind after fluid leaks and dries up, similar to a &quot;crust&quot; left by a dried spill.
                                     </p>
                                  </div>
                               )}

                               {result.observations.some(obs => obs.value.includes('Neovascularization') || result.diagnosis.includes('Proliferative')) && (
                                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 space-y-2">
                                     <h4 className="text-sm font-black text-emerald-900 uppercase tracking-wider">Neovascularization</h4>
                                     <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        The growth of fragile, &quot;bad&quot; new blood vessels. This indicates an advanced attempt by the eye to repair damage.
                                     </p>
                                  </div>
                               )}
                            </>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Recommendations */}
           <div className="lg:col-span-1 space-y-10">
              <div className="clinical-card p-1">
                 <div className="bg-slate-900 rounded-[12px] p-8 text-white space-y-10">
                    <div className="w-14 h-14 bg-accent-primary/20 rounded-2xl flex items-center justify-center text-accent-primary border border-accent-primary/10 shadow-lg">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-2xl font-black tracking-tight">Clinical Recommendations</h3>
                       <p className="text-slate-400 font-medium leading-relaxed">
                          {finalRiskLevel === 'Low' 
                            ? "No immediate pathological markers detected. Please follow the preventative steps below."
                            : "Potential pathological markers identified. We recommend immediate professional consultation."}
                       </p>
                    </div>
                    <ul className="space-y-4 pt-4">
                       {(finalRiskLevel === 'Low' 
                         ? [
                            'No immediate pathological markers detected.',
                            'Continue with annual preventative screenings.',
                            'Maintain standard vascular health monitoring.'
                           ]
                         : [
                            'Potential pathological markers identified.',
                            'Urgent consultation with a Retinal Specialist is recommended.',
                            'Additional OCT or Fluorescein Angiography may be required.'
                           ]
                       ).map((item) => (
                         <li key={item} className="flex items-start gap-4 text-sm font-bold text-slate-200 transition-colors hover:text-accent-primary cursor-default">
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-accent-primary shadow-sm shadow-accent-primary/50 shrink-0"></div>
                            <span>{item}</span>
                         </li>
                       ))}
                    </ul>
                    <div className="pt-8">
                       <Link href="/upload" className="block w-full py-4 bg-accent-primary text-white text-center font-black rounded-xl shadow-lg shadow-accent-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                          New Analysis
                       </Link>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </main>
  );
}
