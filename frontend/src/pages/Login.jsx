import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { mensajeError } from "../api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div className="centro">
      <form className="tarjeta" onSubmit={enviar}>
        <h1>🐾 HuellitasVet</h1>
        <p className="sutil">Ingresa a tu cuenta</p>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Ingresar</button>
        <p className="sutil">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
      </form>
    </div>
  );
}
