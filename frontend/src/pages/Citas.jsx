import { useEffect, useState } from "react";
import api, { mensajeError } from "../api";
import { useAuth } from "../auth.jsx";

export default function Citas() {
  const { usuario } = useAuth();
  const esPersonal = usuario.rol !== "cliente";
  const [citas, setCitas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  const cargar = () => api.get("/citas").then((r) => setCitas(r.data));
  useEffect(() => {
    cargar();
    api.get("/servicios").then((r) => setServicios(r.data));
    api.get("/usuarios/veterinarios").then((r) => setVeterinarios(r.data));
    api.get("/mascotas").then((r) => setMascotas(r.data));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function agendar(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/citas", form);
      setForm(null);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function cambiarEstado(id, estado) {
    await api.put(`/citas/${id}/estado`, { estado });
    cargar();
  }

  async function cancelar(id) {
    await api.delete(`/citas/${id}`);
    cargar();
  }

  return (
    <>
      <div className="fila">
        <h1>Citas</h1>
        <button onClick={() => setForm({ mascota_id: "", veterinario_id: "", servicio_id: "", fecha_hora: "", motivo: "" })}>+ Agendar cita</button>
      </div>

      {form && (
        <form className="tarjeta ancha" onSubmit={agendar}>
          <h2>Agendar cita</h2>
          <div className="grilla">
            <label>Mascota
              <select value={form.mascota_id} onChange={set("mascota_id")} required>
                <option value="">Seleccionar…</option>
                {mascotas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </label>
            <label>Veterinario
              <select value={form.veterinario_id} onChange={set("veterinario_id")} required>
                <option value="">Seleccionar…</option>
                {veterinarios.map((v) => <option key={v.id} value={v.id}>{v.nombre}{v.especialidad ? ` — ${v.especialidad}` : ""}</option>)}
              </select>
            </label>
            <label>Servicio
              <select value={form.servicio_id} onChange={set("servicio_id")} required>
                <option value="">Seleccionar…</option>
                {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </label>
            <label>Fecha y hora<input type="datetime-local" value={form.fecha_hora} onChange={set("fecha_hora")} required /></label>
          </div>
          <label>Motivo<input value={form.motivo} onChange={set("motivo")} /></label>
          {error && <p className="error">{error}</p>}
          <div className="fila"><button type="submit">Agendar</button><button type="button" className="secundario" onClick={() => setForm(null)}>Cancelar</button></div>
        </form>
      )}

      <table>
        <thead><tr><th>Fecha</th><th>Mascota</th><th>Servicio</th><th>Veterinario</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {citas.map((c) => (
            <tr key={c.id}>
              <td>{new Date(c.fecha_hora).toLocaleString("es-CL")}</td>
              <td>{c.mascota_nombre}</td><td>{c.servicio_nombre}</td><td>{c.veterinario_nombre}</td>
              <td><span className={`estado ${c.estado}`}>{c.estado}</span></td>
              <td className="acciones">
                {esPersonal && c.estado === "agendada" && <button className="mini" onClick={() => cambiarEstado(c.id, "confirmada")}>Confirmar</button>}
                {esPersonal && c.estado === "confirmada" && <button className="mini" onClick={() => cambiarEstado(c.id, "atendida")}>Atender</button>}
                {c.estado !== "cancelada" && c.estado !== "atendida" && <button className="mini secundario" onClick={() => cancelar(c.id)}>Cancelar</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
