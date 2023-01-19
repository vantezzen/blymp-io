import React from "react";
import dashboardImage from "../assets/dashboard.png";

function NeonFinInfo() {
  return (
    <div className="max-w-3xl mx-auto text-white font-medium text-base text-left">
      <div className="bg-zinc-800 p-8 rounded-lg flex flex-col md:flex-row gap-6">
        <div>
          <h1 className="text-xl font-bold">Want to optimize your finances?</h1>
          <p className="font-bold text-zinc-400 text-sm py-6">
            Try neonFin by the creators of blymp.io - the ultimate budget book
            app that helps you take control of your finances in a fun and easy
            way.
            <br />
            With our advanced statistics, point and rank system, and AI-powered
            receipt scanning, you'll be able to easily track your spending and
            stay on top of your budget.
          </p>

          <a
            className="p-3 rounded-lg bg-zinc-900 mt-6 text-white font-bold"
            href="https://neonfin.app?utm_source=blymp.io&utm_medium=referral&utm_campaign=blymp.io"
            target="_blank"
          >
            Learn more
          </a>
        </div>

        <img
          src={dashboardImage}
          alt="neonFin Dashboard"
          style={{
            width: 300,
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}

export default NeonFinInfo;
