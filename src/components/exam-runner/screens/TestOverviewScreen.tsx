"use client";

import React, { useEffect, useRef } from "react";

const AUTO_ADVANCE_SECONDS = 3;

/**
 * First screen of a full Mock Test — the real PTE driver's "the test is
 * approximately 2 hours long" duration table, shown once before the
 * candidate ever sees Test Introduction / headset / mic checks.
 */
export default function TestOverviewScreen({ onAutoAdvance }: { onAutoAdvance: () => void }) {
  const firedRef = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onAutoAdvance();
      }
    }, AUTO_ADVANCE_SECONDS * 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl w-full">
      <h2 className="text-base font-bold text-gray-800 mb-4">The test is approximately 2 hours long.</h2>

      <table className="border border-gray-400 text-sm text-gray-800 mb-4">
        <thead>
          <tr>
            <Th>Part</Th>
            <Th>Content</Th>
            <Th>Time allowed</Th>
          </tr>
        </thead>
        <tbody>
          <Row part="Intro" content="Introduction" time="1 minute" />
          <Row part="Part 1" content="Speaking and writing" time="46-67 minute" />
          <Row part="Part 2" content="Reading" time="27-38 minute" />
          <Row part="Part 3" content="Listening" time="30-37 minute" />
        </tbody>
      </table>

      <p className="text-xs text-gray-500 italic">Wait for {AUTO_ADVANCE_SECONDS} seconds or click Next to proceed.</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-gray-400 px-3 py-1.5 bg-gray-50 text-left font-bold italic text-gray-800">
      {children}
    </th>
  );
}

function Row({ part, content, time }: { part: string; content: string; time: string }) {
  return (
    <tr>
      <td className="border border-gray-400 px-3 py-1.5 italic text-[#1e7a9c]">{part}</td>
      <td className="border border-gray-400 px-3 py-1.5 italic text-[#1e7a9c]">{content}</td>
      <td className="border border-gray-400 px-3 py-1.5 italic text-[#1e7a9c]">{time}</td>
    </tr>
  );
}
