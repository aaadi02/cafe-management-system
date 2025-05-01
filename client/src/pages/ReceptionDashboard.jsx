import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "../api/axios";

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [menuForm, setMenuForm] = useState({
    name: "",
    price: "",
    category: "Food",
  });
  const [editingMenuItem, setEditingMenuItem] = useState(null);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");
      if (decoded.role.toLowerCase() !== "reception")
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
      if (decoded.role.toLowerCase() !== "reception")
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

  const handleAddTable = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");
      if (decoded.role.toLowerCase() !== "reception")
        throw new Error("Invalid role: " + decoded.role);

      const response = await axios.post(
        "/api/tables",
        {
          tableNumber: parseInt(tableNumber),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTableNumber("");
      fetchTables();
    } catch (err) {
      console.error("Add table error:", err, {
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(
        err.response?.data?.message || err.message || "Failed to add table"
      );
    }
  };

  const handleDeleteTable = async (tableId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");
      if (decoded.role.toLowerCase() !== "reception")
        throw new Error("Invalid role");

      await axios.delete(`/api/tables/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTables();
    } catch (err) {
      console.error("Delete table error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to delete table"
      );
    }
  };

  const handlePayBill = async (tableId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");
      if (decoded.role.toLowerCase() !== "reception")
        throw new Error("Invalid role");

      await axios.post(
        `/api/tables/${tableId}/pay`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchTables();
    } catch (err) {
      console.error("Pay bill error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to pay bill"
      );
    }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");
      if (decoded.role.toLowerCase() !== "reception")
        throw new Error("Invalid role");

      if (editingMenuItem) {
        await axios.put(
          `/api/menu/${editingMenuItem._id}`,
          {
            name: menuForm.name,
            price: parseFloat(menuForm.price),
            category: menuForm.category,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post(
          "/api/menu",
          {
            name: menuForm.name,
            price: parseFloat(menuForm.price),
            category: menuForm.category,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      setMenuForm({ name: "", price: "", category: "Food" });
      setEditingMenuItem(null);
      fetchMenu();
    } catch (err) {
      console.error("Menu submit error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to save menu item"
      );
    }
  };

  const handleEditMenuItem = (item) => {
    setEditingMenuItem(item);
    setMenuForm({
      name: item.name,
      price: item.price,
      category: item.category,
    });
  };

  const handleDeleteMenuItem = async (itemId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) throw new Error("Token expired");
      if (decoded.role.toLowerCase() !== "reception")
        throw new Error("Invalid role");

      await axios.delete(`/api/menu/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMenu();
    } catch (err) {
      console.error("Delete menu item error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete menu item"
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
        <h1 className="text-3xl font-bold">Reception Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Table</h2>
        <form onSubmit={handleAddTable} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Table Number
            </label>
            <input
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Table
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingMenuItem ? "Edit Menu Item" : "Add Menu Item"}
        </h2>
        <form onSubmit={handleMenuSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Item Name
            </label>
            <input
              type="text"
              value={menuForm.name}
              onChange={(e) =>
                setMenuForm({ ...menuForm, name: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <input
              type="number"
              value={menuForm.price}
              onChange={(e) =>
                setMenuForm({ ...menuForm, price: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={menuForm.category}
              onChange={(e) =>
                setMenuForm({ ...menuForm, category: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="Food">Food</option>
              <option value="Drinks">Drinks</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {editingMenuItem ? "Update Item" : "Add Item"}
          </button>
          {editingMenuItem && (
            <button
              type="button"
              onClick={() => {
                setEditingMenuItem(null);
                setMenuForm({ name: "", price: "", category: "Food" });
              }}
              className="ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Menu</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {menuItems.length === 0 ? (
          <p>No menu items found.</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Food</h3>
              {menuItems
                .filter((item) => item.category === "Food")
                .map((item) => (
                  <div
                    key={item._id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded mb-2"
                  >
                    <span>
                      {item.name} - ₹{item.price.toFixed(2)}
                    </span>
                    <div>
                      <button
                        onClick={() => handleEditMenuItem(item)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMenuItem(item._id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Drinks</h3>
              {menuItems
                .filter((item) => item.category === "Drinks")
                .map((item) => (
                  <div
                    key={item._id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded mb-2"
                  >
                    <span>
                      {item.name} - ₹{item.price.toFixed(2)}
                    </span>
                    <div>
                      <button
                        onClick={() => handleEditMenuItem(item)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMenuItem(item._id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded shadow-md">
        <div className="flex justify-between items CHILDREN-center mb-4">
          <h2 className="text-xl font-semibold">Tables</h2>
          <button
            onClick={fetchTables}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {tables.length === 0 ? (
          <p>No tables found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
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
                  <strong>Assigned Waiter:</strong>{" "}
                  {table.waiterId?.name || "Not Assigned"}
                </p>
                <p>
                  <strong>Total Bill:</strong> ₹{table.totalBill.toFixed(2)}
                </p>
                <p>
                  <strong>Status:</strong> {table.isPaid ? "Paid" : "Unpaid"}
                </p>
                <div className="mt-4 flex space-x-2">
                  {!table.isPaid && (
                    <button
                      onClick={() => handlePayBill(table._id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Pay Bill
                    </button>
                  )}
                  {table.isPaid && (
                    <button
                      onClick={() => handleDeleteTable(table._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Delete Table
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionDashboard;
