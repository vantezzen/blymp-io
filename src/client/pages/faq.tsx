import React from "react";
import faqContent from "../assets/faq-content";
import CookieConsent from "../components/CookieConsent";
import Heading from "../components/Heading";

export default function faqPage() {
  return (
    <>
      <CookieConsent />
      <Heading />

      <div className="legal-text">
        <h2 className="text-primary">
          <span className="underline">FAQ</span>
        </h2>
      </div>
    </>
  );
}
