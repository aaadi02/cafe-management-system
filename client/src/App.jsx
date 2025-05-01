import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import WaiterDashboard from "./pages/WaiterDashboard";
import KitchenDashboard from "./pages/KitchenDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route
          path="/reception"
          element={
            <ProtectedRoute role="reception">
              <ReceptionDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiter"
          element={
            <ProtectedRoute role="waiter">
              <WaiterDashboard />
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
        <Route path="/" element={<Signin />} />
      </Routes>
    </Router>
  );
}

export default App;
