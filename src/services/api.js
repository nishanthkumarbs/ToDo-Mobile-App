import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Use 10.0.2.2 for Android emulator to access localhost on host machine
// If using Expo Go on a physical device, replace with your PC's IP address (e.g., http://192.168.1.100:8080/api)
const API = axios.create({
  baseURL: "https://todo-backend-lldg.onrender.com/api"
});

API.interceptors.request.use(async (req) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

/* ================= TODOS ================= */
export const getTodos = (userId) => API.get(`/todos/user/${userId}`);
export const createTodo = (todo) => API.post("/todos", todo);
export const deleteTodo = (id) => API.delete(`/todos/${id}`);
export const updateTodo = (id, updatedTodo) => API.put(`/todos/${id}`, updatedTodo);

/* ================= AUTH ================= */
export const registerUser = async (userData) => {
  const res = await API.post("/auth/register", userData);
  return res.data;
};

export const loginUser = async (email, password) => {
  const res = await API.post("/auth/login", { email, password });
  return res.data;
};

export const updateUser = async (id, userData) => {
  const res = await API.patch(`/users/${id}`, userData);
  return res.data;
};

export default API;
