import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, role }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      console.log("ProtectedRoute token:", token); // Debug token
      if (!token) {
        console.log("No token found");
        setIsAuthorized(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded);
        const isExpired = decoded.exp * 1000 < Date.now();
        console.log("Token expired:", isExpired, "Expected role:", role);
        if (decoded.role.toLowerCase() === role.toLowerCase() && !isExpired) {
          setIsAuthorized(true);
        } else {
          console.log("Role mismatch or token expired:", decoded.role, role);
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Token decode error:", error);
        setIsAuthorized(false);
      }
    };
    checkAuth();
  }, [role]);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/signin" />;
};

export default ProtectedRoute;
