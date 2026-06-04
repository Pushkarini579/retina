"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className="bg-white/80 border-b border-slate-100 sticky top-0 z-50 backdrop-blur-md"
      aria-label="Primary navigation"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Healthway Diagnostics home"
          >
            <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 shadow-lg shadow-accent-primary/20">
              <div className="w-5 h-5 border-[3px] border-white rounded-full"></div>
            </div>

            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">
                Healthway
              </span>
              <span className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.2em] leading-none mt-1">
                Diagnostics
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-700 uppercase tracking-widest">
            <Link href="/" className="hover:text-accent-primary transition-colors">
              Home
            </Link>

            <Link
              href="/history"
              className="hover:text-accent-primary transition-colors"
            >
              History
            </Link>

            <Link
              href="/technology"
              className="hover:text-accent-primary transition-colors"
            >
              Technology
            </Link>

            <Link
              href="/upload"
              className="clinical-btn !py-2.5 !px-6 text-[11px] shadow-sm"
            >
              Launch Portal
            </Link>
          </div>

          {/* Mobile Button */}
            <button
            className="md:hidden text-3xl font-bold text-slate-700"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            >
            {isOpen ? "✕" : "☰"}
            </button>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
        <div className="md:hidden border-t border-slate-200 mt-4 pt-4">
            <div className="flex flex-col gap-6 pb-4 text-sm font-bold uppercase tracking-widest text-slate-700">
            <Link href="/" onClick={() => setIsOpen(false)}>
                Home
            </Link>

            <Link href="/history" onClick={() => setIsOpen(false)}>
                History
            </Link>

            <Link href="/technology" onClick={() => setIsOpen(false)}>
                Technology
            </Link>

            <Link
                href="/upload"
                className="clinical-btn text-center"
                onClick={() => setIsOpen(false)}
            >
                Launch Portal
            </Link>
            </div>
        </div>
        )}
      </div>
    </nav>
  );
}