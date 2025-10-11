import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Users,
  LogIn,
  FileText,
  Home,
  Menu,
  X,
  Images ,
  Grid2x2Plus ,
  Boxes ,
  ShoppingCart,
  Percent,
  ChevronLeft,
} from "lucide-react";


type SidebarItemProps = {
  icon: React.ElementType;
  label: string;
  to: string;
  isActive: boolean;
  isCollapsed: boolean;
};

const SidebarItem = ({ icon: Icon, label, to, isActive, isCollapsed }: SidebarItemProps) => {
  return (
    <Link to={to}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 pl-4 py-3 rounded-lg font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner ring-1 ring-sidebar-border"
            : "hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/90 text-sidebar-foreground/80"
        )}
      >
        <Icon size={20} />
        <span
          className={cn(
            "whitespace-nowrap transition-all duration-200",
            isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
          )}
        >
          {label}
        </span>
      </Button>
    </Link>
  );
};

const COLLAPSE_KEY = "admin.sidebar.collapsed";

const AdminSidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true); // mobile drawer
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(COLLAPSE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(isCollapsed));
    } catch {}
    document.body.classList.toggle("sidebar-collapsed", isCollapsed);
    window.dispatchEvent(new CustomEvent("sidebar:collapseChanged", { detail: { isCollapsed } }));
  }, [isCollapsed]);

  const menuItems = [
    { icon: Home, label: "Dashboard", to: "/dashboard" },
    { icon: Grid2x2Plus, label: "Categories", to: "/categories" },
    { icon: Boxes, label: "Products", to: "/products" },
    { icon: ShoppingCart, label: "Orders", to: "/orders" },
    { icon: Percent, label: "Coupons", to: "/coupons" },
    { icon: FileText, label: "Blogs", to: "/blogs" },
    { icon: Users, label: "Users", to: "/users" },
    { icon: Settings, label: "Settings", to: "/settings" },
    { icon: LogIn, label: "Logout", to: "/logout" },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapsed = () => setIsCollapsed((v) => !v);

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden text-sidebar-foreground bg-sidebar-background/80 border border-sidebar-border shadow-md rounded-full backdrop-blur"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-sidebar text-sidebar-foreground shadow-xl transition-all duration-300 ease-in-out border-r border-sidebar-border/60",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          isCollapsed ? "w-20" : "w-64"
        )}
        style={{ width: isCollapsed ? "5rem" : "16rem" }}
      >
        <div className="flex flex-col h-full">
          {/* Logo / header */}
          <div className="px-4 py-3 border-b border-sidebar-border/60 bg-sidebar/90 backdrop-blur supports-[backdrop-filter]:bg-sidebar/80">
            <div className="flex h-12 items-center">
              <Link to="/dashboard" className="flex items-center gap-3 flex-1 min-w-0">
                <span className="bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-xl shadow-sm shrink-0">Y</span>
                <div className={cn("leading-tight transition-all duration-200", isCollapsed ? "hidden" : "block")}
                >
                  <h1 className="text-base font-semibold tracking-wide">Yuwam Admin</h1>
                  <p className="text-xs text-sidebar-foreground/70">Admin Portal</p>
                </div>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "hidden lg:flex h-8 w-8 items-center justify-center rounded-full border border-sidebar-border/60 bg-sidebar-accent/20 text-sidebar-foreground/80",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60",
                  "shrink-0 ml-2"
                )}
                onClick={toggleCollapsed}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                <ChevronLeft className={cn("transition-transform duration-200", isCollapsed ? "rotate-180" : "rotate-0")} size={18} />
              </Button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.to}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  isActive={location.pathname === item.to}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border/60 text-xs text-sidebar-foreground/60">
            <p className={cn(isCollapsed ? "hidden" : "block")}>Yuwam Admin v1.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
