import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "../api";

const WaiterDashboardOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTables = async () => {
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
        err.message || err.response?.data?.message || "Failed to fetch tables"
      );
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");
      if (decoded.role.toLowerCase() !== "waiter")
        throw new Error("Invalid role");

      const response = await axios.get(`/api/orders?waiterId=${decoded.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError(
        err.message || err.response?.data?.message || "Failed to fetch orders"
      );
      if (
        err.message === "No token found" ||
        err.message === "Token expired" ||
        err.message === "Invalid role"
      ) {
        localStorage.removeItem("token");
        navigate("/signin", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchOrders();
    const interval = setInterval(() => {
      fetchTables();
      fetchOrders();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleServeOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/orders/${orderId}/serve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchOrders();
    } catch (err) {
      console.error("Serve order error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to serve order"
      );
    }
  };

  const handleGenerateBill = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const order = orders.find((o) => o._id === orderId);
      if (!order || order.status !== "served" || order.billGenerated) {
        setError("Order must be served and unbilled to generate bill");
        return;
      }
      await axios.put(
        `/api/orders/${orderId}/generate-bill`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchOrders();
      fetchTables();
    } catch (err) {
      console.error("Generate bill error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to generate bill"
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Waiter Orders</h1>
        <div className="space-x-4">
          <button
            onClick={() => navigate("/waiter")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4">My Orders</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading && <p>Loading...</p>}
        {orders.length === 0 ? (
          <p>No orders placed.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Table</th>
                  <th className="py-2 px-4 border-b text-left">Customer</th>
                  <th className="py-2 px-4 border-b text-left">Items</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Total</th>
                  <th className="py-2 px-4 border-b text-left">
                    Bill Generated
                  </th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const table = tables.find(
                    (t) => t._id.toString() === order.tableId.toString()
                  );
                  return (
                    <tr key={order._id}>
                      <td className="py-2 px-4 border-b">
                        {table ? `Table ${table.tableNumber}` : "Unknown"}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {table?.customerName || "Not Assigned"}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {order.items.map((item) => (
                          <div key={item.menuItemId}>
                            {item.menuItemId?.name} x {item.quantity} (₹
                            {item.menuItemId?.price?.toFixed(2)})
                          </div>
                        ))}
                      </td>
                      <td className="py-2 px-4 border-b">{order.status}</td>
                      <td className="py-2 px-4 border-b">
                        ₹{order.total.toFixed(2)}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {order.billGenerated ? "Yes" : "No"}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {order.status === "ready" && (
                          <button
                            onClick={() => handleServeOrder(order._id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2"
                          >
                            Serve
                          </button>
                        )}
                        {order.status === "served" && !order.billGenerated && (
                          <button
                            onClick={() => handleGenerateBill(order._id)}
                            className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                          >
                            Generate Bill
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterDashboardOrders;
