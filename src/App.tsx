import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
// Auth pages
import Login from "./pages/Login";
import ForgetPass from "./pages/ForgetPass";
import Logout from "./pages/Logout";
import ChangePassword from "./pages/ChangePassword";
// Layout
import AdminLayout from "./components/layout/AdminLayout";
// Dashboard
import Dashboard from "./pages/Dashboard";

// Blogs
import BlogsList from "./pages/Blogs/BlogsList";
import BlogForm from "./pages/Blogs/BlogForm";

// Bookings and Users
import UsersList from "./pages/Users/UsersList";

// Settings
import Settings from "./pages/Settings";

//api keys 
import UpdateApiKey from "./pages/ApiKeys/UpdateViatorApiKey";

// categories
import CategoriesList from "./pages/Categories/CategoryList";
import CategoryForm from "./pages/Categories/CategoryForm";

// Products
import ProductList from "./pages/Products/ProductList";
import ProductForm from "./pages/Products/ProductForm";

//courses
import CourseForm from "./pages/courses/CourseForm";
// Orders
import OrderList from "./pages/Orders/OrderList";
import OrderDetail from "./pages/Orders/OrderDetail";

// NotFound
import NotFound from "./pages/NotFound";

// Coupons
import CouponList from "./pages/Coupons/CouponList";
import CouponForm from "./pages/Coupons/CouponForm";
import CourseList from "./pages/courses/CourseList";

const queryClient = new QueryClient();

// Auth protection for routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  useEffect(() => {
    // Check if user is not authenticated and not already on login page
    if (!isAuthenticated && location.pathname !== "/") {
      console.log("User not authenticated, redirecting to login");
    }
  }, [isAuthenticated, location]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const defaultLinks = {
  facebook: "",
  twitter: "",
  instagram: "",
  linkedin: "",
  youtube: "",
  whatsapp: "",
  tiktok: "",
  pinterest: "",
  telegram: "",
};

const SocialMediaSettings = () => {
  const [links, setLinks] = React.useState(defaultLinks);
  const [savedLinks, setSavedLinks] = React.useState(defaultLinks);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLinks({ ...links, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedLinks(links);
    toast.success("Social media links saved (locally)");
  };

  const handleReset = () => {
    setLinks(savedLinks);
    toast("Changes reverted");
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Social Media Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="facebook" className="text-sm font-medium">Facebook</label>
                <Input id="facebook" name="facebook" value={links.facebook} onChange={handleChange} placeholder="https://facebook.com/yourpage" />
              </div>
              <div>
                <label htmlFor="twitter" className="text-sm font-medium">Twitter</label>
                <Input id="twitter" name="twitter" value={links.twitter} onChange={handleChange} placeholder="https://twitter.com/yourhandle" />
              </div>
              <div>
                <label htmlFor="instagram" className="text-sm font-medium">Instagram</label>
                <Input id="instagram" name="instagram" value={links.instagram} onChange={handleChange} placeholder="https://instagram.com/yourprofile" />
              </div>
              <div>
                <label htmlFor="linkedin" className="text-sm font-medium">LinkedIn</label>
                <Input id="linkedin" name="linkedin" value={links.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/yourprofile" />
              </div>
              <div>
                <label htmlFor="youtube" className="text-sm font-medium">YouTube</label>
                <Input id="youtube" name="youtube" value={links.youtube} onChange={handleChange} placeholder="https://youtube.com/yourchannel" />
              </div>
              <div>
                <label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</label>
                <Input id="whatsapp" name="whatsapp" value={links.whatsapp} onChange={handleChange} placeholder="https://wa.me/yourphonenumber" />
              </div>
              <div>
                <label htmlFor="tiktok" className="text-sm font-medium">TikTok</label>
                <Input id="tiktok" name="tiktok" value={links.tiktok} onChange={handleChange} placeholder="https://tiktok.com/@yourhandle" />
              </div>
              <div>
                <label htmlFor="pinterest" className="text-sm font-medium">Pinterest</label>
                <Input id="pinterest" name="pinterest" value={links.pinterest} onChange={handleChange} placeholder="https://pinterest.com/yourprofile" />
              </div>
              <div>
                <label htmlFor="telegram" className="text-sm font-medium">Telegram</label>
                <Input id="telegram" name="telegram" value={links.telegram} onChange={handleChange} placeholder="https://t.me/yourusername" />
              </div>
            </div>
            <CardFooter className="flex gap-2 justify-end px-0">
              <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
              <Button type="submit">Save</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {Object.entries(savedLinks).map(([key, value]) =>
              value ? (
                <li key={key}>
                  <span className="font-medium capitalize">{key}:</span>{' '}
                  <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{value}</a>
                </li>
              ) : null
            )}
            {Object.values(savedLinks).every(v => !v) && (
              <li className="text-muted-foreground">No social media links saved yet.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      {/* <Sonner /> */}
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgetPass />} />
          <Route path="/logout" element={<Logout />} />

          {/* Protected routes with admin layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            
           
            
            {/* Blogs routes */}
            <Route path="/blogs" element={<BlogsList />} />
            <Route path="/blogs/add" element={<BlogForm />} />
            <Route path="/blogs/edit/:id" element={<BlogForm />} />
            
            {/* Bookings and users routes */}
            <Route path="/users" element={<UsersList />} />

             {/* Categories routes */}
            <Route path="/categories" element={<CategoriesList />} />
            <Route path="/categories/add" element={<CategoryForm />} />
            <Route path="/categories/edit/:id" element={<CategoryForm />} />

            {/* Products routes */}
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/add" element={<ProductForm />} />
            <Route path="/products/edit/:id" element={<ProductForm />} />

            {/* Courses routes */}
            <Route path="/courses" element={<CourseList/>}/>
            <Route path="/course/add" element={<CourseForm/>}/>
            <Route path="/course/edit/:id" element={<CourseForm/>}/>

            {/* Orders routes */}
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            
            {/* Settings */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/Api-keys" element={<UpdateApiKey />} />
            <Route path="/settings/social-media" element={<SocialMediaSettings />} />

            {/* Coupons routes */}
            <Route path="/coupons" element={<CouponList />} />
            <Route path="/coupons/add" element={<CouponForm />} />
            <Route path="/coupons/edit/:id" element={<CouponForm />} />
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
