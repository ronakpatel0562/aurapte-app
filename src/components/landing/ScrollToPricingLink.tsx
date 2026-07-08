"use client";

import React from "react";

/**
 * The default anchor-link scroll (href="#pricing") aligns the section's
 * *top* to the viewport top, which crops the pricing cards on shorter
 * screens. This centers the section vertically in the viewport instead.
 */
export default function ScrollToPricingLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "center" });
    history.pushState(null, "", "#pricing");
  };

  return (
    <a href="#pricing" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
