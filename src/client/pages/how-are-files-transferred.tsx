import React from "react";
import CookieConsent from "../components/CookieConsent";
import Navbar from "../components/Navbar";

export default function HowAreFilesTransferred() {
  return (
    <>
      <CookieConsent />
      <Navbar />

      <div className="legal-text">
        <h2 className="text-primary mb-8">
          <span className="underline">How does blymp.io transfer files?</span>
        </h2>

        <p className="mb-4">
          This article aims to provide a more in-depth explanation of the
          technologies used by blymp.io to transfer files.
        </p>
        <p className="mb-4">
          In short, blymp.io transfers files directly between computers instead
          of uploading them to a server first, which allows higher speeds than
          some other websites that deliver similar services.
        </p>
        <p className="mb-4">
          When first opening blymp.io in your browser, blymp.io will generate a
          random 4-digit code that allows others to connect to you easily.
          Generally, our system prefers to use repeating codes like "1212" or
          "1122" to allow you to connect to others easily but might also get
          other, random numbers that are less repeating.
        </p>
        <p className="mb-4">
          Once another client enters the 4-digit code, blymp.io will perform a
          handshake of the two clients that determines, what technology is
          supported by both browsers. If compatible, blymp.io will use WebRTC -
          a peer-to-peer connection directly between browsers. WebRTC is also
          used by video-call services to enable real-time video calls.
          <br />
          If WebRTC is not supported, blymp.io will use WebSockets instead - a
          connection that is not peer-to-peer but still allows for
          near-real-time communication. In the case of WebSockets, blymp.io
          unfortunately needs to route the data through our server which adds
          additional latency and requires more trust about that blymp.io won't
          store your transferred files.
          <br />
          To help improve this trust, blymp.io's source code is open-source and
          can be found on GitHub.
        </p>
        <p className="mb-4">
          To find out, which technology is used by blymp.io on your computer,
          you can take a look at the browser results on the compatability page
          of blymp.io. Additionaly, during transfer you can see the technology
          used - in case blymp.io determined that the transfer needs to fall
          back to another method.
        </p>
        <p className="mb-4">
          After the handshake is completed, the sending client will first
          compress the file locally using zlib. This allows the files to be
          transferred faster without loosing any details.
        </p>
        <p className="mb-4">
          The compressed file will then be transferred using 15kb chunks over
          the connection that had been established.
          <br />
          During this transfer, blymp.io will keep a close eye on the time it
          takes for each chunk to be transferred. Using this information, the
          estimated remaining time will be calculated and displayed on both
          devices.
          <br />
          Additionally, if the WebRTC connection is lost, blymp.io will
          automatically attempt to reconnect or switch to WebSockets depending
          on the connection status to keep the transfer going.
        </p>
        <p className="mb-4">
          If the transfer is completed, the receiving client will combine all
          received files chunks and decompress the final file - again using
          zlib. The file will then be saved to the computer.
        </p>
        <p className="mb-4">
          blymp.io's source code is designed to allows additional preprocessing
          of the transferred files before uploading or after downloading the
          content.
          <br />
          One of these processing steps is the automatic compression of files
          but other preprocessing steps can be added in the future to make the
          transfer even faster.
          <br />
          In any case, all processing is done completely in the browser to
          ensure minimal trust needed in out servers.
          <br />
          If you have ideas on methods to improve the transfer speed, feel free
          to test them yourself using the blymp.io's source code or by creating
          a new feature request on GitHub Issues.
        </p>
      </div>
    </>
  );
}
