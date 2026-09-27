"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function HeaderFrame({ children }: { children: React.ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll position to switch between the transparent "top" state
  // and the translucent/blurred "scrolled" state.
  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      setScrolled(window.scrollY > 12);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The header is `position: fixed`, so it no longer reserves space in the
  // document flow. Measure its real rendered height (which differs between
  // the mobile h-16 bar and the taller desktop row) and publish it as a CSS
  // variable that both the layout spacer and `scroll-padding-top` read —
  // one source of truth, no hardcoded breakpoint duplication.
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const applyHeight = () => {
      document.documentElement.style.setProperty(
        "--aff-header-h",
        `${node.offsetHeight}px`,
      );
    };
    applyHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", applyHeight);
      return () => window.removeEventListener("resize", applyHeight);
    }

    const observer = new ResizeObserver(applyHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b px-6 transition-colors duration-300 ease-out sm:px-10 lg:h-auto lg:px-[120px] lg:py-7",
          scrolled
            ? "border-aff-line bg-aff-bg/75 shadow-[0_8px_30px_rgba(0,0,0,0.28)] backdrop-blur-md"
            : "border-transparent bg-transparent shadow-none backdrop-blur-none",
        )}
      >
        {children}
      </header>
      {/* Spacer: reserves the exact header height in normal flow so fixed
          positioning never hides page content underneath it. */}
      <div aria-hidden="true" style={{ height: "var(--aff-header-h)" }} />
    </>
  );
}
