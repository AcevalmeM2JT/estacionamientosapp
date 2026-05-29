"use client";

import { useEffect, useState } from "react";

export function SidebarToggle() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-[30] bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      <style>{`
        @media (max-width: 767px) {
          aside {
            position: fixed;
            inset: 0;
            z-index: 40;
            width: 100%;
            transform: translateX(${open ? "0" : "-100%"});
            transition: transform 0.25s ease-in-out;
          }
        }
      `}</style>
    </>
  );
}
