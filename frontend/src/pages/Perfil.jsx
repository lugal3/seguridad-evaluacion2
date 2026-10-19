import { useEffect, useState } from "react";
import api, { mensajeError } from "../api";

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState({ telefono: "", direccion: "", password: "" });
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/autenticacion/perfil").then((r) => {
      setPerfil(r.data);
      setForm({ telefono: r.data.telefono || "", direccion: r.data.direccion || "", password: "" });
    });
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setError(""); setMensaje("");
    const payload = { telefono: form.telefono, direccion: form.direccion };
    if (form.password) payload.password = form.password;
    try {
      await api.put("/usuarios/perfil", payload);
      setMensaje("Datos actualizados correctamente");
      setForm({ ...form, password: "" });
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  if (!perfil) return <p>Cargando…</p>;

  return (
    <>
      <h1>Mi perfil</h1>
      <form className="tarjeta" onSubmit={guardar}>
        <div className="grilla">
          <div><b>Nombre:</b> {perfil.nombre}</div>
          <div><b>RUT:</b> {perfil.rut}</div>
          <div><b>Email:</b> {perfil.email}</div>
          <div><b>Rol:</b> {perfil.rol}</div>
        </div>
        <label>Teléfono<input value={form.telefono} onChange={set("telefono")} /></label>
        <label>Dirección<input value={form.direccion} onChange={set("direccion")} /></label>
        <label>Nueva contraseña (opcional)<input type="password" value={form.password} onChange={set("password")} /></label>
        {mensaje && <p className="ok">{mensaje}</p>}
        {error && <p className="error">{error}</p>}
        <button type="submit">Guardar cambios</button>
      </form>
    </>
  );
}
