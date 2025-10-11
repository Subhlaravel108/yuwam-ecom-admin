import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login or dashboard based on authentication
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    navigate(isAuthenticated ? "/dashboard" : "/");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-600">Please wait</p>
      </div>
    </div>
  );
};

export default Index;
