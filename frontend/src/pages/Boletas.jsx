import { useEffect, useState } from "react";
import api, { mensajeError } from "../api";

const clp = (n) => "$" + Number(n || 0).toLocaleString("es-CL");

export default function Boletas() {
  const [boletas, setBoletas] = useState([]);
  const [citasAtendidas, setCitasAtendidas] = useState([]);
  const [form, setForm] = useState({ cita_id: "", descuento_porcentaje: "0", metodo_pago: "efectivo" });
  const [error, setError] = useState("");

  const cargar = () => api.get("/boletas").then((r) => setBoletas(r.data));
  useEffect(() => {
    cargar();
    api.get("/citas", { params: { estado: "atendida" } }).then((r) => setCitasAtendidas(r.data));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function emitir(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/boletas", { ...form, descuento_porcentaje: Number(form.descuento_porcentaje) });
      setForm({ cita_id: "", descuento_porcentaje: "0", metodo_pago: "efectivo" });
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <>
      <h1>Boletas</h1>
      <form className="tarjeta ancha" onSubmit={emitir}>
        <h2>Emitir boleta</h2>
        <div className="grilla">
          <label>Cita atendida
            <select value={form.cita_id} onChange={set("cita_id")} required>
              <option value="">Seleccionar…</option>
              {citasAtendidas.map((c) => <option key={c.id} value={c.id}>#{c.id} — {c.mascota_nombre} — {c.servicio_nombre}</option>)}
            </select>
          </label>
          <label>Descuento (%)<input type="number" value={form.descuento_porcentaje} onChange={set("descuento_porcentaje")} /></label>
          <label>Método de pago
            <select value={form.metodo_pago} onChange={set("metodo_pago")}>
              {["efectivo", "debito", "credito", "transferencia"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Emitir boleta</button>
      </form>

      <table>
        <thead><tr><th>#</th><th>Mascota</th><th>Subtotal</th><th>Descuento</th><th>IVA</th><th>Total</th><th>Pago</th></tr></thead>
        <tbody>
          {boletas.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td><td>{b.mascota_nombre}</td><td>{clp(b.subtotal)}</td>
              <td>{clp(b.descuento)}</td><td>{clp(b.iva)}</td><td><b>{clp(b.total)}</b></td><td>{b.metodo_pago}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
