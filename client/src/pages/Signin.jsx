import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "../api/axios";

const Signin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post("/api/auth/signin", {
        email,
        password,
      });
      console.log("Signin response:", response.data);
      const { token } = response.data;
      if (!token) {
        throw new Error("No token received from server");
      }
      // Clear old token
      localStorage.removeItem("token");
      localStorage.setItem("token", token);
      // Navigate based on role
      const decoded = jwtDecode(token);
      console.log("Decoded token after signin:", decoded);
      navigate(
        decoded.role.toLowerCase() === "reception" ? "/reception" : "/waiter"
      );
    } catch (err) {
      console.error("Signin error:", err, {
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.message || "Signin failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Sign In
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </form>
        <p className="mt-4 text-center">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-500">
            Signup
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signin;
