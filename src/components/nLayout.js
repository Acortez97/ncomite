import React from "react";
import NavMenu from "./NavMenu";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <>
      <NavMenu />
      <main style={{ padding: "20px", minHeight: "calc(100vh - 120px)" }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
