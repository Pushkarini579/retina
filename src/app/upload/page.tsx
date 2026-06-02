"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// ---------------------------------------------------------------------------
// Validation constants — mirrors the accept attribute on the hidden <input>
// ---------------------------------------------------------------------------
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/dicom"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".dicom"];
// 15 MB for DICOM, 10 MB cap applied uniformly here for simplicity
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

interface ValidationError {
  type: "type" | "size";
  message: string;
}

function validateFile(file: File): ValidationError | null {
  // Check extension as a fallback for DICOM which may report as octet-stream
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );
  const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type);

  if (!hasValidExtension && !hasValidMime) {
    return {
      type: "type",
      message: `Unsupported file format. Please upload a .JPG, .PNG, or .DICOM retina scan. You selected: "${file.name}"`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      type: "size",
      message: `File too large (${sizeMB} MB). Maximum allowed size is 15 MB. Please compress or re-export the scan.`,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Upload loading phase messages for clearer progress feedback
// ---------------------------------------------------------------------------
const LOADING_PHASES = [
  "Uploading retina scan...",
  "Segmenting optic disc & vasculature...",
  "Running neural inference engine...",
  "Compiling diagnostic report...",
] as const;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [patientName, setPatientName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  // Tracks whether the last attempt failed so we can show a visible retry prompt
  const [lastError, setLastError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Rotate through loading phase messages while the upload is in flight
  // ---------------------------------------------------------------------------
  const startLoadingPhases = useCallback(() => {
    setLoadingPhase(0);
    let phase = 0;
    loadingIntervalRef.current = setInterval(() => {
      phase = Math.min(phase + 1, LOADING_PHASES.length - 1);
      setLoadingPhase(phase);
    }, 2500);
  }, []);

  const stopLoadingPhases = useCallback(() => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
    setLoadingPhase(0);
  }, []);

  // ---------------------------------------------------------------------------
  // File selection — validates first, then revokes the old preview URL to
  // prevent browser memory leaks before creating a new one.
  // ---------------------------------------------------------------------------
  const setSelectedFile = useCallback(
    (selectedFile: File) => {
      const error = validateFile(selectedFile);

      if (error) {
        setValidationError(error);
        // Do not update the file state — keep any previously valid file intact
        return;
      }

      // Clear any previous validation error on successful selection
      setValidationError(null);
      setLastError(null);

      // Revoke the previous object URL before creating a new one (memory fix)
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(selectedFile);
      });

      setFile(selectedFile);
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onDropZoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFilePicker();
    }
  };

  // ---------------------------------------------------------------------------
  // Clear — revoke object URL before discarding the reference (memory fix)
  // ---------------------------------------------------------------------------
  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setValidationError(null);
    setLastError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ---------------------------------------------------------------------------
  // Dismiss the inline validation error without clearing the selected file
  // ---------------------------------------------------------------------------
  const dismissValidationError = () => {
    setValidationError(null);
  };

  // ---------------------------------------------------------------------------
  // Submit — existing API call is completely unchanged. Only UX wrappers added.
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLastError(null);
    setUploading(true);
    startLoadingPhases();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientName", patientName || "Anonymous");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Store result and local preview for the result page — unchanged
        sessionStorage.setItem(
          "lastAnalysis",
          JSON.stringify({
            ...result,
            localPreview: preview,
          })
        );
        router.push("/result");
      } else {
        let errorMessage =
          "The image could not be processed. Please ensure you are uploading a valid, high-resolution retina fundus photograph and try again.";

        try {
          const errorData = await response.json();
          console.error("Backend error:", errorData);
          // Use the server-provided message if it is human-readable enough
          if (errorData.detail || errorData.error) {
            errorMessage = errorData.detail || errorData.error;
          }
        } catch {
          // response body was not JSON — keep the friendly fallback
        }

        setLastError(errorMessage);

        Swal.fire({
          title: "Upload Failed",
          text: errorMessage,
          icon: "error",
          confirmButtonColor: "#2e7d32",
          confirmButtonText: "Try Again",
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);

      const connectionMessage =
        "Unable to reach the clinical server. Please check your network connection and try again.";

      setLastError(connectionMessage);

      Swal.fire({
        title: "Connection Error",
        text: connectionMessage,
        icon: "error",
        confirmButtonColor: "#2e7d32",
        confirmButtonText: "Retry",
      });
    } finally {
      stopLoadingPhases();
      setUploading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const canSubmit = !!file && !!patientName.trim() && !uploading && !validationError;
  const isNameMissing = !patientName.trim() && !!file;

  return (
    <main
      className="flex-grow flex flex-col items-center justify-center p-6 bg-slate-50/30 relative"
      aria-label="Retina diagnostic upload portal"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue-light/50 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-teal-light/50 rounded-full blur-[100px] -z-10"></div>

      <div className="w-full max-w-xl animate-fade-in-up">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Diagnostic Portal
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Secure high-resolution retina scan upload.
          </p>
        </div>

        {/* ----------------------------------------------------------------
            Inline retry banner — shown when the previous attempt failed.
            Stays visible so the user can act without re-reading SweetAlert.
        ---------------------------------------------------------------- */}
        {lastError && !uploading && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-2xl"
          >
            <svg
              className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-black text-red-800 uppercase tracking-wider">
                Analysis Failed
              </p>
              <p className="text-sm font-medium text-red-700">{lastError}</p>
            </div>
            <button
              type="button"
              onClick={() => setLastError(null)}
              aria-label="Dismiss error message"
              className="text-red-400 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded-lg p-0.5 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="clinical-card p-2 group">
          <div className="bg-white rounded-[12px] p-6 md:p-12 transition-all">
            <form onSubmit={handleSubmit} className="space-y-10" noValidate>
              {/* ---- Patient Name ---- */}
              <div className="space-y-3">
                <label
                  htmlFor="patient-name"
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"
                >
                  Patient Full Name
                </label>
                <input
                  id="patient-name"
                  type="text"
                  required
                  placeholder="Enter full name for the report"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  aria-required="true"
                  aria-describedby={isNameMissing ? "patient-name-hint" : undefined}
                  aria-invalid={isNameMissing ? "true" : "false"}
                  className={`w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl focus:outline-none focus:bg-white transition-all text-slate-800 font-bold placeholder:text-slate-300 shadow-inner ${
                    isNameMissing
                      ? "border-red-300 focus:border-red-400"
                      : "border-slate-100 focus:border-accent-primary/30"
                  }`}
                />
                {isNameMissing && (
                  <p
                    id="patient-name-hint"
                    role="alert"
                    className="text-[11px] font-bold text-red-500 ml-1"
                  >
                    Patient name is required to generate the clinical report.
                  </p>
                )}
              </div>

              {/* ---- File Drop Zone ---- */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className="relative"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.dicom"
                  onChange={handleFileChange}
                  className="sr-only"
                  id="file-upload"
                  aria-describedby="file-upload-help file-upload-status"
                  aria-label="Upload retina scan file"
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={openFilePicker}
                  onKeyDown={onDropZoneKeyDown}
                  aria-label={
                    file
                      ? `Selected file: ${file.name}. Press Enter or Space to choose a different retina scan.`
                      : "Choose or drop a retina scan image. Supported formats: DICOM, JPG, PNG."
                  }
                  aria-describedby="file-upload-help file-upload-status"
                  aria-invalid={validationError ? "true" : "false"}
                  className={`flex flex-col items-center justify-center w-full h-56 md:h-80 border-2 border-dashed rounded-[1rem] cursor-pointer transition-all duration-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-primary/30 focus-visible:border-accent-primary ${
                    validationError
                      ? "border-red-300 bg-red-50/50"
                      : isDragging
                      ? "border-accent-primary bg-accent-primary/5 scale-[1.01]"
                      : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-accent-primary/30"
                  }`}
                >
                  {!file ? (
                    <div className="flex flex-col items-center text-center px-6 md:px-10 space-y-6">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-accent-primary">
                        <svg
                          className="w-10 h-10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-black text-slate-800 tracking-tight">
                          {isDragging ? "Release to upload" : "Upload Scan imagery"}
                        </p>
                        <p
                          id="file-upload-help"
                          className="text-xs text-slate-600 font-bold uppercase tracking-[0.2em]"
                        >
                          Supported: .DICOM, .JPG, .PNG · Max 15 MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center p-10 space-y-8 animate-fade-in">
                      <div className="w-24 h-24 rounded-3xl bg-accent-primary flex items-center justify-center text-white shadow-xl shadow-accent-primary/30 border-4 border-white">
                        <svg
                          className="w-12 h-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-black text-slate-900 truncate max-w-sm">
                          {file.name}
                        </p>
                        <p className="text-[10px] font-black uppercase text-accent-primary tracking-[0.2em]">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB · Press Enter or Space to replace
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accessible live status region */}
                <p
                  id="file-upload-status"
                  className="sr-only"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {file
                    ? `${file.name} selected for analysis.`
                    : "No retina scan selected."}
                </p>

                {/* ---- Inline file validation error ---- */}
                {validationError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mt-3 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <svg
                      className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-red-700 uppercase tracking-wider">
                        {validationError.type === "type"
                          ? "Invalid File Format"
                          : "File Too Large"}
                      </p>
                      <p className="text-xs font-medium text-red-600 mt-0.5">
                        {validationError.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={dismissValidationError}
                      aria-label="Dismiss file validation error"
                      className="text-red-400 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded-md p-0.5 transition-colors shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* ---- Remove file button ---- */}
                {file && (
                  <button
                    type="button"
                    onClick={clearFile}
                    className="mt-4 text-[10px] font-black uppercase text-accent-primary hover:text-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-2 tracking-[0.2em] transition-colors"
                    aria-label={`Remove selected file: ${file.name}`}
                  >
                    Remove File Selection
                  </button>
                )}
              </div>

              {/* ---- Submit / Retry Button ---- */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="clinical-btn w-full !py-6 text-xl shadow-xl shadow-accent-primary/20"
                aria-label={
                  uploading
                    ? `Analysis in progress: ${LOADING_PHASES[loadingPhase]}`
                    : lastError
                    ? "Retry analysis with selected file"
                    : "Execute retina scan analysis"
                }
                aria-busy={uploading}
                aria-disabled={!canSubmit}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-4">
                    <svg
                      className="animate-spin h-7 w-7 text-white shrink-0"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="flex flex-col text-left">
                      <span className="text-base font-black">Neural Engine Active</span>
                      <span className="text-xs font-bold opacity-80">
                        {LOADING_PHASES[loadingPhase]}
                      </span>
                    </span>
                  </span>
                ) : lastError ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry Analysis
                  </span>
                ) : (
                  "Execute Analysis"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Submission Guidelines — unchanged */}
        <div className="mt-10 clinical-card p-1 bg-white/50 border-slate-200">
          <div className="bg-white/80 rounded-[12px] p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <svg
                className="w-5 h-5 text-accent-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">
                Scan Submission Guidelines
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] leading-relaxed">
              <div className="space-y-2">
                <p className="font-black text-slate-800 uppercase tracking-tighter">
                  Required Image Type
                </p>
                <ul className="space-y-1.5 text-slate-500 font-medium">
                  <li className="flex gap-2">
                    <span className="text-accent-primary font-bold" aria-hidden="true">✓</span>
                    Professional Fundus Photograph (Retinal Scan)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent-primary font-bold" aria-hidden="true">✓</span>
                    High-resolution digital output (.JPG, .PNG, .DICOM)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent-primary font-bold" aria-hidden="true">✓</span>
                    Clear visibility of Optic Disc and Macula
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-black text-slate-800 uppercase tracking-tighter">
                  Prohibited Imagery
                </p>
                <ul className="space-y-1.5 text-slate-500 font-medium">
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold" aria-hidden="true">✕</span>
                    Standard smartphone selfies or external eye photos
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold" aria-hidden="true">✕</span>
                    Low-quality or blurry scans
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold" aria-hidden="true">✕</span>
                    Non-biological graphics or text-only images
                  </li>
                </ul>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-[10px] text-slate-400 font-medium italic">
                Note: The Neural Engine will automatically reject non-retinal or
                low-quality imagery to maintain clinical integrity.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-10 opacity-50">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              End-to-End Encrypted
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Clinical v4.2.0
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
