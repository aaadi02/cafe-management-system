import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import WaiterDashboard from "./pages/WaiterDashboard";
import WaiterDashboardOrders from "./pages/WaiterDashboardOrders";
import KitchenDashboard from "./pages/KitchenDashboard";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/Signup";

const ProtectedRoute = ({ role, children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/signin";
    return null;
  }
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
      return null;
    }
    if (role && decoded.role.toLowerCase() !== role.toLowerCase()) {
      window.location.href = "/signin";
      return null;
    }
    return children;
  } catch (err) {
    localStorage.removeItem("token");
    window.location.href = "/signin";
    return null;
  }
};

const App = () => {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        window.location.href = "/signin";
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/waiter"
          element={
            <ProtectedRoute role="waiter">
              <WaiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiter/orders"
          element={
            <ProtectedRoute role="waiter">
              <WaiterDashboardOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute role="kitchen">
              <KitchenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reception"
          element={
            <ProtectedRoute role="reception">
              <ReceptionDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
