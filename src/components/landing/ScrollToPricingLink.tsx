"use client";

import React from "react";

export default function ScrollToPricingLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("pricing-heading") || document.getElementById("pricing");
    if (target) {
      const headerOffset = 88;
      let top = target.getBoundingClientRect().top + window.scrollY - headerOffset;

      const footer = document.querySelector("footer");
      if (footer) {
        const footerTop = footer.getBoundingClientRect().top + window.scrollY;
        const maxTopWithoutFooter = footerTop - window.innerHeight;
        top = Math.min(top, maxTopWithoutFooter);
      }

      window.scrollTo({ top, behavior: "smooth" });
    }
    history.pushState(null, "", "#pricing");
  };

  return (
    <a href="#pricing" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
