import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../auth.jsx";

const clp = (n) => "$" + Number(n || 0).toLocaleString("es-CL");

export default function Inicio() {
  const { usuario } = useAuth();
  const [metricas, setMetricas] = useState(null);
  const [proximas, setProximas] = useState([]);

  useEffect(() => {
    if (usuario.rol !== "cliente") {
      api.get("/reportes/dashboard").then((r) => setMetricas(r.data));
    }
    api.get("/citas", { params: { desde: new Date().toISOString() } })
      .then((r) => setProximas(r.data.filter((c) => c.estado !== "cancelada").slice(-8).reverse()));
  }, [usuario.rol]);

  return (
    <>
      <h1>Hola, {usuario.nombre}</h1>
      {metricas && (
        <div className="kpis">
          <div className="kpi"><span>Citas hoy</span><strong>{metricas.citas_hoy}</strong></div>
          <div className="kpi"><span>Mascotas activas</span><strong>{metricas.mascotas_activas}</strong></div>
          <div className="kpi"><span>Clientes</span><strong>{metricas.clientes}</strong></div>
          <div className="kpi"><span>Ingresos del mes</span><strong>{clp(metricas.ingresos_mes)}</strong></div>
        </div>
      )}
      <h2>Próximas citas</h2>
      {proximas.length === 0 ? <p className="sutil">No hay citas próximas.</p> : (
        <table>
          <thead><tr><th>Fecha</th><th>Mascota</th><th>Servicio</th><th>Veterinario</th><th>Estado</th></tr></thead>
          <tbody>
            {proximas.map((c) => (
              <tr key={c.id}>
                <td>{new Date(c.fecha_hora).toLocaleString("es-CL")}</td>
                <td>{c.mascota_nombre}</td><td>{c.servicio_nombre}</td>
                <td>{c.veterinario_nombre}</td><td><span className={`estado ${c.estado}`}>{c.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
