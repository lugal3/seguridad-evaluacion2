import { useEffect, useState } from "react";
import api, { mensajeError } from "../api";
import { useAuth } from "../auth.jsx";

const vacio = { rut: "", nombre: "", email: "", telefono: "", password: "", rol: "recepcionista", especialidad: "" };

export default function Usuarios() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  const cargar = () => api.get("/usuarios").then((r) => setUsuarios(r.data));
  useEffect(() => { cargar(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function crear(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/usuarios", form);
      setForm(null);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function desactivar(id) {
    await api.delete(`/usuarios/${id}`);
    cargar();
  }

  return (
    <>
      <div className="fila">
        <h1>Usuarios</h1>
        {usuario.rol === "admin" && <button onClick={() => setForm(vacio)}>+ Nuevo usuario</button>}
      </div>

      {form && (
        <form className="tarjeta ancha" onSubmit={crear}>
          <h2>Nuevo usuario</h2>
          <div className="grilla">
            <label>RUT<input value={form.rut} onChange={set("rut")} required /></label>
            <label>Nombre<input value={form.nombre} onChange={set("nombre")} required /></label>
            <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
            <label>Teléfono<input value={form.telefono} onChange={set("telefono")} /></label>
            <label>Contraseña<input type="password" value={form.password} onChange={set("password")} required /></label>
            <label>Rol
              <select value={form.rol} onChange={set("rol")}>
                {["admin", "veterinario", "recepcionista"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
            {form.rol === "veterinario" && <label>Especialidad<input value={form.especialidad} onChange={set("especialidad")} /></label>}
          </div>
          {error && <p className="error">{error}</p>}
          <div className="fila"><button type="submit">Crear</button><button type="button" className="secundario" onClick={() => setForm(null)}>Cancelar</button></div>
        </form>
      )}

      <table>
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>RUT</th><th></th></tr></thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td><td>{u.email}</td><td>{u.rol}</td><td>{u.rut}</td>
              <td>{usuario.rol === "admin" && u.rol !== "admin" && <button className="mini secundario" onClick={() => desactivar(u.id)}>Desactivar</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
