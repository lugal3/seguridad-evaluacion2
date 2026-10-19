import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { mensajeError } from "../api";

const vacio = { rut: "", nombre: "", email: "", telefono: "", direccion: "", password: "", confirmar: "" };

export default function Registro() {
  const navigate = useNavigate();
  const [f, setF] = useState(vacio);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (f.password !== f.confirmar) return setError("Las contraseñas no coinciden");
    if (f.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    try {
      const { confirmar, ...datos } = f; // eslint-disable-line no-unused-vars
      await api.post("/autenticacion/registro", datos);
      navigate("/login");
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div className="centro">
      <form className="tarjeta" onSubmit={enviar}>
        <h1>Crear cuenta</h1>
        <label>RUT<input value={f.rut} onChange={set("rut")} placeholder="12345678-5" required /></label>
        <label>Nombre completo<input value={f.nombre} onChange={set("nombre")} required /></label>
        <label>Email<input type="email" value={f.email} onChange={set("email")} required /></label>
        <label>Teléfono<input value={f.telefono} onChange={set("telefono")} /></label>
        <label>Dirección<input value={f.direccion} onChange={set("direccion")} /></label>
        <label>Contraseña<input type="password" value={f.password} onChange={set("password")} required /></label>
        <label>Confirmar contraseña<input type="password" value={f.confirmar} onChange={set("confirmar")} required /></label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Registrarme</button>
        <p className="sutil"><Link to="/login">Volver al inicio de sesión</Link></p>
      </form>
    </div>
  );
}
