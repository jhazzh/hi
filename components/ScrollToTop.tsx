'use client';
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { goToTop } from './Helper';

export default function GoToTop() {
  const pathname = usePathname();

  useEffect(() => {
    goToTop();
  }, [pathname]);

  return null;
}
