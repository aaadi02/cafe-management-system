import { useState, useEffect, Component } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "../api";
import io from "socket.io-client";

// Error Boundary Component
class KitchenDashboardErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-500">
            Something went wrong
          </h2>
          <p className="text-gray-600">
            {this.state.error?.message || "An error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const KitchenDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.get("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched orders:", response.data);
      setOrders(response.data);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("useEffect Decoded:", decoded);
        if (decoded.exp * 1000 < Date.now()) {
          console.log("Token expired, redirecting to signin");
          localStorage.removeItem("token");
          navigate("/signin", { replace: true });
          return;
        }
        if (decoded.role.toLowerCase() !== "kitchen") {
          console.log("Invalid role, redirecting to signin");
          localStorage.removeItem("token");
          navigate("/signin", { replace: true });
          return;
        }
        fetchOrders();

        const socket = io("http://localhost:5000", {
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
          console.log("Socket connected:", socket.id);
        });

        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err.message);
          setError("Failed to connect to real-time updates");
        });

        socket.on("disconnect", () => {
          console.log("Socket disconnected");
        });

        socket.on("orderUpdate", (updatedOrder) => {
          console.log("Order update received:", updatedOrder);
          setOrders((prevOrders) => {
            const existingOrder = prevOrders.find(
              (order) => order._id === updatedOrder._id
            );
            if (existingOrder) {
              return prevOrders.map((order) =>
                order._id === updatedOrder._id ? updatedOrder : order
              );
            }
            return [...prevOrders, updatedOrder];
          });
        });

        const interval = setInterval(() => {
          const currentToken = localStorage.getItem("token");
          if (currentToken) {
            const currentDecoded = jwtDecode(currentToken);
            if (currentDecoded.exp * 1000 < Date.now()) {
              console.log(
                "Token expired during interval, redirecting to signin"
              );
              localStorage.removeItem("token");
              navigate("/signin", { replace: true });
              clearInterval(interval);
              socket.disconnect();
              return;
            }
          }
          fetchOrders();
        }, 5000);

        return () => {
          socket.disconnect();
          clearInterval(interval);
        };
      } catch (err) {
        console.error("Token error:", err);
        setError("Authentication error: Invalid token");
        localStorage.removeItem("token");
        navigate("/signin", { replace: true });
      }
    } else {
      console.log("No token found, redirecting to signin");
      navigate("/signin", { replace: true });
    }
  }, [navigate]);

  const handleMarkReady = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/orders/${orderId}/status`,
        { status: "served" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setError("");
      setSuccess("Order marked as ready");
      fetchOrders();
    } catch (err) {
      console.error("Mark order ready error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to mark order ready"
      );
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.post(
          "/api/auth/logout",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      navigate("/signin", { replace: true });
    }
  };

  return (
    <KitchenDashboardErrorBoundary>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Kitchen Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        <div className="bg-white p-6 rounded shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Orders</h2>
          {loading && <p>Loading...</p>}
          {orders.length === 0 ? (
            <p>No orders available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-gray-50 p-4 rounded-lg shadow-md"
                >
                  <h3 className="text-lg font-semibold">
                    Order for Table {order.tableId?.tableNumber || "Unknown"}
                  </h3>
                  <p>
                    <strong>Items:</strong>{" "}
                    {order.items
                      .map((item) => `${item.name} x ${item.quantity}`)
                      .join(", ")}
                  </p>
                  <p>
                    <strong>Status:</strong> {order.status}
                  </p>
                  <p>
                    <strong>Total:</strong> ₹{order.total.toFixed(2)}
                  </p>
                  {order.status !== "served" && (
                    <button
                      onClick={() => handleMarkReady(order._id)}
                      className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Mark Ready
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </KitchenDashboardErrorBoundary>
  );
};

export default KitchenDashboard;
