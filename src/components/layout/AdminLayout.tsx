
import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { Toaster } from "sonner";

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      
      <div className="layout-content lg:pl-64 flex-1 min-h-screen transition-[padding] duration-300">
        <header className="sticky top-0 z-30 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="font-semibold text-sm text-muted-foreground">Welcome back</div>
          </div>
        </header>
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      
      <Toaster position="top-right" />
    </div>
  );
};

export default AdminLayout;
