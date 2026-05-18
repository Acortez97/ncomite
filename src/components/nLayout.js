import React from "react";
import NavMenu from "./NavMenu";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <>
      <NavMenu />
      <main style={{ padding: "clamp(12px, 3vw, 24px)", minHeight: "calc(100vh - 120px)" }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
