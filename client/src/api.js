import axios from "axios";
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});
export default instance;
export const createOrder = async (orderData) => {
  const response = await instance.post("/api/orders", orderData, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data;
};
export const getOrders = async () => {
  const response = await instance.get("/api/orders", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data;
};
export const serveOrder = async (id) => {
  const response = await instance.put(
    `/api/orders/${id}/serve`,
    {},
    {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }
  );
  return response.data;
};
export const generateBill = async (id) => {
  const response = await instance.put(
    `/api/orders/${id}/generate-bill`,
    {},
    {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }
  );
  return response.data;
};
