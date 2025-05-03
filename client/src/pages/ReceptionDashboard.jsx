import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "../api";

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [menuForm, setMenuForm] = useState({
    name: "",
    price: "",
    category: "Veg",
    ml: "",
  });
  const [accountForm, setAccountForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "waiter",
  });

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
      // Sort tables by tableNumber in ascending order
      const sortedTables = response.data.sort(
        (a, b) => a.tableNumber - b.tableNumber
      );
      setTables(sortedTables);
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

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.get("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError(
        err.message || err.response?.data?.message || "Failed to fetch orders"
      );
    }
  };

  useEffect(() => {
    fetchTables();
    fetchMenu();
    fetchOrders();
    const interval = setInterval(() => {
      fetchTables();
      fetchMenu();
      fetchOrders();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!tableNumber || isNaN(tableNumber) || parseInt(tableNumber) < 1) {
        setError("Please enter a valid table number");
        return;
      }
      await axios.post(
        "/api/tables",
        { tableNumber: parseInt(tableNumber) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTableNumber("");
      setError("");
      setSuccess("Table added successfully");
      fetchTables();
    } catch (err) {
      console.error("Add table error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to add table"
      );
    }
  };

  const handleDeleteTable = async (tableId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/tables/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setError("");
      setSuccess("Table deleted successfully");
      fetchTables();
    } catch (err) {
      console.error("Delete table error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to delete table"
      );
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const { name, price, category, ml } = menuForm;
      if (!name || !price || isNaN(price) || parseFloat(price) <= 0) {
        setError("Please enter a valid name and price");
        return;
      }
      if (category === "Beverages" && (!ml || isNaN(ml) || parseInt(ml) <= 0)) {
        setError("Please enter a valid ml value for Beverages");
        return;
      }
      const payload = {
        name,
        price: parseFloat(price),
        category,
        ...(category === "Beverages" && { ml: parseInt(ml) }),
      };
      await axios.post("/api/menu", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenuForm({ name: "", price: "", category: "Veg", ml: "" });
      setError("");
      setSuccess("Menu item added successfully");
      fetchMenu();
    } catch (err) {
      console.error("Add menu item error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to add menu item"
      );
    }
  };

  const handlePayBill = async (tableId) => {
    try {
      const token = localStorage.getItem("token");
      const tableOrders = orders.filter(
        (order) =>
          order.tableId.toString() === tableId.toString() &&
          order.billGenerated &&
          !order.paid
      );
      if (tableOrders.length === 0) {
        setError("No unpaid bills found for this table");
        return;
      }
      for (const order of tableOrders) {
        await axios.put(
          `/api/orders/${order._id}/pay`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      setError("");
      setSuccess("Bill paid successfully");
      fetchTables();
      fetchOrders();
    } catch (err) {
      console.error("Pay bill error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to pay bill"
      );
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const { name, email, password, confirmPassword, role } = accountForm;
      if (!name || !email || !password || !confirmPassword || !role) {
        setError("All fields are required");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!["waiter", "kitchen"].includes(role)) {
        setError("Invalid role selected");
        return;
      }
      await axios.post(
        "/api/auth/signup/reception",
        { name, email, password, confirmPassword, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccountForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "waiter",
      });
      setError("");
      setSuccess(`Account created for ${name} (${role})`);
    } catch (err) {
      console.error("Create account error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to create account"
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
        <h2 className="text-xl font-semibold mb-4">Add Table</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
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
        <h2 className="text-xl font-semibold mb-4">Add Menu Item</h2>
        <form onSubmit={handleAddMenuItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
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
                setMenuForm({ ...menuForm, category: e.target.value, ml: "" })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Drinks">Drinks</option>
              <option value="Beverages">Beverages</option>
            </select>
          </div>
          {menuForm.category === "Beverages" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Milliliters (ml)
              </label>
              <input
                type="number"
                value={menuForm.ml}
                onChange={(e) =>
                  setMenuForm({ ...menuForm, ml: e.target.value })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Menu Item
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Menu Items</h2>
        {menuItems.length === 0 ? (
          <p>No menu items found.</p>
        ) : (
          <div className="space-y-6">
            {["Veg", "Non-Veg", "Drinks", "Beverages"].map((category) => {
              const items = menuItems.filter(
                (item) => item.category === category
              );
              if (items.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <ul className="list-disc pl-5">
                    {items.map((item) => (
                      <li key={item._id}>
                        {item.name} - ₹{item.price.toFixed(2)}
                        {item.ml ? ` (${item.ml} ml)` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Manage Accounts</h2>
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={accountForm.name}
              onChange={(e) =>
                setAccountForm({ ...accountForm, name: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={accountForm.email}
              onChange={(e) =>
                setAccountForm({ ...accountForm, email: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={accountForm.password}
              onChange={(e) =>
                setAccountForm({ ...accountForm, password: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              value={accountForm.confirmPassword}
              onChange={(e) =>
                setAccountForm({
                  ...accountForm,
                  confirmPassword: e.target.value,
                })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={accountForm.role}
              onChange={(e) =>
                setAccountForm({ ...accountForm, role: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="waiter">Waiter</option>
              <option value="kitchen">Kitchen</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Account
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4">Tables</h2>
        {loading && <p>Loading...</p>}
        {tables.length === 0 ? (
          <p>No tables found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => {
              const tableOrders = orders.filter(
                (order) => order.tableId.toString() === table._id.toString()
              );
              const billGenerated = tableOrders.some(
                (order) => order.billGenerated
              );
              const isPaid =
                tableOrders.length > 0 &&
                tableOrders.every((order) => order.paid);
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
                    <strong>Assigned Waiter:</strong>{" "}
                    {table.waiterId?.name || "Not Assigned"}
                  </p>
                  <p>
                    <strong>Total Bill:</strong> ₹{table.totalBill.toFixed(2)}
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
                          {order.items.map((item) => (
                            <span key={item.menuItemId}>
                              {item.name} x {item.quantity}
                              {item.ml ? ` (${item.ml} ml)` : ""}
                            </span>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            ({order.status})
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="flex justify-center space-x-4">
                    {!isPaid && billGenerated && (
                      <button
                        onClick={() => handlePayBill(table._id)}
                        className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                      >
                        Pay Bill
                      </button>
                    )}
                    {isPaid && (
                      <button
                        onClick={() => handleDeleteTable(table._id)}
                        className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
                      >
                        Delete Table
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionDashboard;
