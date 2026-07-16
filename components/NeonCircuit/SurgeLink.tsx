'use client';
import Link from "next/link";
import type { ComponentProps } from "react";
import { circuitSurge } from "./NeonCircuit";

// next/link that fires a circuit surge on click. Client-only wrapper so Home
// can stay a server component.
export default function SurgeLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        circuitSurge();
        onClick?.(e);
      }}
    />
  );
}
