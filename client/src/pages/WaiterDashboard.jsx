import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "../api/axios";

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [order, setOrder] = useState({ menuItemId: "", quantity: "" });

  const fetchTables = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");
      if (decoded.role.toLowerCase() !== "waiter")
        throw new Error("Invalid role");

      const response = await axios.get("/api/tables", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTables(response.data);
    } catch (err) {
      console.error("Fetch tables error:", err);
      setError(
        err.message || err.response?.data?.message || "Failed to fetch tables"
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

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");
      if (decoded.role.toLowerCase() !== "waiter")
        throw new Error("Invalid role");

      const response = await axios.get("/api/menu", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenuItems(response.data);
    } catch (err) {
      console.error("Fetch menu error:", err);
      setError(
        err.message || err.response?.data?.message || "Failed to fetch menu"
      );
    }
  };

  useEffect(() => {
    fetchTables();
    fetchMenu();
    const interval = setInterval(() => {
      fetchTables();
      fetchMenu();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleTableClick = async (table) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      const waiterId = decoded.id;

      await axios.put(
        `/api/tables/${table._id}`,
        {
          waiterId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedTable(table);
      setCustomerName(table.customerName || "");
      fetchTables();
    } catch (err) {
      console.error("Assign waiter error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to assign waiter"
      );
    }
  };

  const handleCustomerNameSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      await axios.put(
        `/api/tables/${selectedTable._id}`,
        {
          customerName,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCustomerName("");
      fetchTables();
    } catch (err) {
      console.error("Update customer name error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update customer name"
      );
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      const waiterId = decoded.id;

      await axios.post(
        `/api/tables/${selectedTable._id}/orders`,
        {
          menuItemId: order.menuItemId,
          quantity: parseInt(order.quantity),
          waiterId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOrder({ menuItemId: "", quantity: "" });
      fetchTables();
    } catch (err) {
      console.error("Add order error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to add order"
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
        <h1 className="text-3xl font-bold">Waiter Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Menu</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {menuItems.length === 0 ? (
          <p>No menu items available.</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Food</h3>
              {menuItems
                .filter((item) => item.category === "Food")
                .map((item) => (
                  <div key={item._id} className="p-2 bg-gray-50 rounded mb-2">
                    {item.name} - ₹{item.price.toFixed(2)}
                  </div>
                ))}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Drinks</h3>
              {menuItems
                .filter((item) => item.category === "Drinks")
                .map((item) => (
                  <div key={item._id} className="p-2 bg-gray-50 rounded mb-2">
                    {item.name} - ₹{item.price.toFixed(2)}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Tables</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {tables.length === 0 ? (
          <p>No tables found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div
                key={table._id}
                onClick={() => handleTableClick(table)}
                className="bg-gray-50 p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-100"
              >
                <h3 className="text-lg font-semibold">
                  Table {table.tableNumber}
                </h3>
                <p>
                  <strong>Customer:</strong>{" "}
                  {table.customerName || "Not Assigned"}
                </p>
                <p>
                  <strong>Assigned Waiter:</strong>{" "}
                  {table.waiterId?.name || "Not Assigned"}
                </p>
                <p>
                  <strong>Total Bill:</strong> ₹{table.totalBill.toFixed(2)}
                </p>
                <p>
                  <strong>Orders:</strong>
                </p>
                <ul className="list-disc pl-5">
                  {table.orders.map((order, index) => (
                    <li key={index}>
                      {order.menuItemId?.name} - ₹
                      {order.menuItemId?.price.toFixed(2)} x {order.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTable && (
        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Manage Table {selectedTable.tableNumber}
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Update Customer Name
              </h3>
              <form onSubmit={handleCustomerNameSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Update Customer
                </button>
              </form>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Add Order</h3>
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Menu Item
                  </label>
                  <select
                    value={order.menuItemId}
                    onChange={(e) =>
                      setOrder({ ...order, menuItemId: e.target.value })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  >
                    <option value="">Select an item</option>
                    {menuItems.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} ({item.category}) - ₹{item.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={order.quantity}
                    onChange={(e) =>
                      setOrder({ ...order, quantity: e.target.value })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Order
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterDashboard;
