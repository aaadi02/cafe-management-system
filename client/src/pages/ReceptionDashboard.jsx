import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableNumber, setTableNumber] = useState("");

  const fetchTables = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) rage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axios.get("/api/tables", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTables(response.data);
    } catch (err) {
      console.error("Fetch tables error:", err);
      setError(err.response?.data?.message || "Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      await axios.post(
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
      console.error("Add table error:", err);
      setError(err.response?.data?.message || "Failed to add table");
    }
  };

  const handleDeleteTable = async (tableId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/tables/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTables();
    } catch (err) {
      console.error("Delete table error:", err);
      setError(err.response?.data?.message || "Failed to delete table");
    }
  };

  const handlePayBill = async (tableId) => {
    try {
      const token = localStorage.getItem("token");
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
      setError(err.response?.data?.message || "Failed to pay bill");
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

      <div className="bg-white p-6 rounded shadow-md">
        <div className="flex justify-between items-center mb-4">
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
