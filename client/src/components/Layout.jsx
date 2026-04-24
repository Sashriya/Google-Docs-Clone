import React from "react";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
