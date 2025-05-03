import { useState, useEffect, Component } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "../api";
import io from "socket.io-client";

// Error Boundary Component
class WaiterDashboardErrorBoundary extends Component {
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

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.get("/api/tables", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTables(response.data);
    } catch (err) {
      console.error("Fetch tables error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch tables"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
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
    }
  };

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.get("/api/menu", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched menu:", response.data);
      setMenuItems(response.data);
    } catch (err) {
      console.error("Fetch menu error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch menu"
      );
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
        if (decoded.role.toLowerCase() !== "waiter") {
          console.log("Invalid role, redirecting to signin");
          localStorage.removeItem("token");
          navigate("/signin", { replace: true });
          return;
        }
        fetchTables();
        fetchOrders();
        fetchMenu();

        const socket = io("http://localhost:5000", {
          path: "/socket.io/",
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ["websocket", "polling"], // Try WebSocket first
        });

        socket.on("connect", () => {
          console.log("Socket connected:", socket.id);
        });

        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", {
            message: err.message,
            description: err.description,
            context: err.context,
            type: err.type,
          });
          setError("Failed to connect to real-time updates");
        });

        socket.on("error", (err) => {
          console.error("Socket error:", err);
        });

        socket.on("disconnect", () => {
          console.log("Socket disconnected");
        });

        socket.on("orderUpdate", (updatedOrder) => {
          console.log("Order update received:", updatedOrder);
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order._id === updatedOrder._id ? updatedOrder : order
            )
          );
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
          fetchTables();
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

  const handleItemToggle = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedTableId) {
      setError("Please select a table");
      return;
    }
    if (selectedItems.length === 0) {
      setError("Please select at least one menu item");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const items = selectedItems.map((itemId) => {
        const item = menuItems.find((menuItem) => menuItem._id === itemId);
        return {
          menuItemId: item._id,
          name: item.name,
          quantity: 1,
          category: item.category,
          ml: item.ml || undefined,
        };
      });
      const response = await axios.post(
        "/api/orders",
        { tableId: selectedTableId, items },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTableId("");
      setSelectedItems([]);
      setError("");
      setSuccess("Order sent to kitchen successfully");
      fetchOrders();
    } catch (err) {
      console.error("Create order error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to create order"
      );
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setError("");
      setSuccess(`Order status updated to ${status}`);
      fetchOrders();
    } catch (err) {
      console.error("Update order status error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update order status"
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
    <WaiterDashboardErrorBoundary>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Waiter Dashboard</h1>
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
          <h2 className="text-xl font-semibold mb-4">Create Order</h2>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Table
              </label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              >
                <option value="">Select a table</option>
                {tables.map((table) => (
                  <option key={table._id} value={table._id}>
                    Table {table.tableNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Menu Items
              </label>
              <div className="mt-2 max-h-64 overflow-y-auto border border-gray-300 rounded-md p-2">
                {menuItems.length === 0 ? (
                  <p>No menu items available</p>
                ) : (
                  menuItems.map((item) => (
                    <div key={item._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item._id)}
                        onChange={() => handleItemToggle(item._id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">
                        {item.name} (₹{item.price.toFixed(2)}
                        {item.ml ? `, ${item.ml}ml` : ""}, {item.category})
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Send Order to Kitchen
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Tables and Orders</h2>
          {loading && <p>Loading...</p>}
          {tables.length === 0 ? (
            <p>No tables available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map((table) => {
                const tableOrders = orders.filter(
                  (order) =>
                    order.tableId &&
                    order.tableId.toString() === table._id.toString()
                );
                return (
                  <div
                    key={table._id}
                    className="bg-gray-50 p-4 rounded-lg shadow-md"
                  >
                    <h3 className="text-lg font-semibold">
                      Table {table.tableNumber}
                    </h3>
                    <p>
                      <strong>Customer:</strong>{" "}
                      {table.customerName || "Not Assigned"}
                    </p>
                    <p>
                      <strong>Orders:</strong>
                    </p>
                    <ul className="list-disc pl-5 mb-4">
                      {tableOrders.length === 0 ? (
                        <li>No orders placed.</li>
                      ) : (
                        tableOrders.map((order, index) => (
                          <li key={index}>
                            <strong>Items:</strong>{" "}
                            {order.items
                              .map((item) => `${item.name} x ${item.quantity}`)
                              .join(", ")}
                            <br />
                            <strong>Status:</strong> {order.status}
                            <br />
                            <strong>Total:</strong> ₹{order.total.toFixed(2)}
                            <div className="mt-2 flex space-x-2">
                              {order.status === "pending" && (
                                <button
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order._id,
                                      "accepted"
                                    )
                                  }
                                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                >
                                  Accept
                                </button>
                              )}
                              {order.status === "accepted" && (
                                <button
                                  onClick={() =>
                                    handleUpdateOrderStatus(order._id, "served")
                                  }
                                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                >
                                  Mark Served
                                </button>
                              )}
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </WaiterDashboardErrorBoundary>
  );
};

export default WaiterDashboard;
