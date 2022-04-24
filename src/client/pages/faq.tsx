import React from "react";
import faqContent from "../assets/faq-content";
import CookieConsent from "../components/CookieConsent";
import Navbar from "../components/Navbar";

export default function faqPage() {
  return (
    <>
      <CookieConsent />
      <Navbar />

      <div className="legal-text">
        <h2 className="text-primary">
          <span className="underline">FAQ</span>
        </h2>

        {faqContent.rows.map((item) => (
          <div>
            <h2 className="text-secondary mt-8 text-xl">{item.title}</h2>
            <p
              dangerouslySetInnerHTML={{ __html: item.content }}
              className="text-sm"
            ></p>
          </div>
        ))}
      </div>
    </>
  );
}
