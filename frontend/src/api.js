import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});

api.interceptors.request.use((cfg) => {
  // El token se guarda en localStorage para mantener la sesión.
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export function mensajeError(err) {
  return err?.response?.data?.error || "Ocurrió un error inesperado";
}

export default api;
