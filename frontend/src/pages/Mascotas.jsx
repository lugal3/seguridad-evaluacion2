import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { mensajeError } from "../api";
import { useAuth } from "../auth.jsx";

const vacia = { nombre: "", especie: "Perro", raza: "", sexo: "M", fecha_nacimiento: "", peso_kg: "", microchip: "", observaciones: "", tutor_id: "" };

export default function Mascotas() {
  const { usuario } = useAuth();
  const [mascotas, setMascotas] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  const cargar = () => api.get("/mascotas").then((r) => setMascotas(r.data));
  useEffect(() => { cargar(); }, []);

  async function buscar(e) {
    e.preventDefault();
    if (!q) return cargar();
    const { data } = await api.get("/mascotas/buscar", { params: { q } });
    setMascotas(data);
  }

  async function guardar(e) {
    e.preventDefault();
    setError("");
    if (form.peso_kg !== "" && Number(form.peso_kg) <= 0) return setError("El peso debe ser mayor a 0");
    try {
      await api.post("/mascotas", { ...form, peso_kg: form.peso_kg || null, tutor_id: form.tutor_id || undefined });
      setForm(null);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="fila">
        <h1>Mascotas</h1>
        <button onClick={() => setForm(vacia)}>+ Nueva mascota</button>
      </div>
      <form className="fila" onSubmit={buscar}>
        <input placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="secundario" type="submit">Buscar</button>
      </form>

      {form && (
        <form className="tarjeta ancha" onSubmit={guardar}>
          <h2>Nueva mascota</h2>
          <div className="grilla">
            {usuario.rol !== "cliente" && <label>ID del tutor<input value={form.tutor_id} onChange={set("tutor_id")} required /></label>}
            <label>Nombre<input value={form.nombre} onChange={set("nombre")} required /></label>
            <label>Especie
              <select value={form.especie} onChange={set("especie")}>
                {["Perro", "Gato", "Conejo", "Ave", "Reptil", "Otro"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
            <label>Raza<input value={form.raza} onChange={set("raza")} /></label>
            <label>Sexo
              <select value={form.sexo} onChange={set("sexo")}><option value="M">Macho</option><option value="H">Hembra</option></select>
            </label>
            <label>Fecha de nacimiento<input type="date" value={form.fecha_nacimiento} onChange={set("fecha_nacimiento")} /></label>
            <label>Peso (kg)<input type="number" step="0.01" value={form.peso_kg} onChange={set("peso_kg")} /></label>
            <label>Microchip<input value={form.microchip} onChange={set("microchip")} /></label>
          </div>
          <label>Observaciones<textarea value={form.observaciones} onChange={set("observaciones")} /></label>
          {error && <p className="error">{error}</p>}
          <div className="fila"><button type="submit">Guardar</button><button type="button" className="secundario" onClick={() => setForm(null)}>Cancelar</button></div>
        </form>
      )}

      <table>
        <thead><tr><th>Nombre</th><th>Especie</th><th>Raza</th>{usuario.rol !== "cliente" && <th>Tutor</th>}<th></th></tr></thead>
        <tbody>
          {mascotas.map((m) => (
            <tr key={m.id}>
              <td>{m.nombre}</td><td>{m.especie}</td><td>{m.raza}</td>
              {usuario.rol !== "cliente" && <td>{m.tutor_nombre}</td>}
              <td><Link to={`/mascotas/${m.id}`}>Ver ficha</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
