import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      const storedUser = JSON.parse(localStorage.getItem("duser") || '{}');
      const token = storedUser.access_token;

      try {
        if (token) {
          await api.post(
            "/logout",
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }
      } catch (error) {
        console.error("Logout failed:", error);
      } finally {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("duser");
        toast.success("Logged out successfully");
        navigate("/");
      }
    };

    logout();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging Out</h1>
        <p className="text-gray-600">Please wait...</p>
      </div>
    </div>
  );
};

export default Logout;
