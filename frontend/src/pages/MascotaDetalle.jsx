import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { mensajeError } from "../api";

function edad(fecha) {
  if (!fecha) return "—";
  const anios = new Date().getFullYear() - new Date(fecha).getFullYear();
  return `${anios} año(s)`;
}

export default function MascotaDetalle() {
  const { id } = useParams();
  const [m, setM] = useState(null);
  const [hist, setHist] = useState({ atenciones: [], vacunas: [] });
  const [adjuntos, setAdjuntos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState("");

  const cargarAdjuntos = () => api.get(`/adjuntos/mascota/${id}`).then((r) => setAdjuntos(r.data));

  useEffect(() => {
    api.get(`/mascotas/${id}`).then((r) => setM(r.data)).catch((e) => setError(mensajeError(e)));
    api.get(`/mascotas/${id}/historial`).then((r) => setHist(r.data));
    cargarAdjuntos();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function subir(e) {
    e.preventDefault();
    if (!archivo) return;
    const fd = new FormData();
    fd.append("mascota_id", id);
    fd.append("file", archivo);
    try {
      await api.post("/adjuntos", fd);
      setArchivo(null);
      e.target.reset();
      cargarAdjuntos();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function descargar(a) {
    const r = await api.get(`/adjuntos/${a.id}/descargar`, { responseType: "blob" });
    const url = URL.createObjectURL(r.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = a.nombre_original;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <p className="error">{error}</p>;
  if (!m) return <p>Cargando…</p>;

  return (
    <>
      <h1>{m.nombre} <span className="sutil">({m.especie}{m.raza ? `, ${m.raza}` : ""})</span></h1>
      <div className="tarjeta ancha">
        <div className="grilla">
          <div><b>Tutor:</b> {m.tutor_nombre}</div>
          <div><b>Sexo:</b> {m.sexo === "H" ? "Hembra" : "Macho"}</div>
          <div><b>Edad:</b> {edad(m.fecha_nacimiento)}</div>
          <div><b>Peso:</b> {m.peso_kg ? `${m.peso_kg} kg` : "—"}</div>
          <div><b>Microchip:</b> {m.microchip || "—"}</div>
        </div>
        <h3>Observaciones</h3>
        <div className="observaciones">{m.observaciones || <i>Sin observaciones</i>}</div>
      </div>

      <h2>Atenciones</h2>
      {hist.atenciones.length === 0 ? <p className="sutil">Sin atenciones registradas.</p> : (
        <table>
          <thead><tr><th>Fecha</th><th>Diagnóstico</th><th>Tratamiento</th><th>Peso</th><th>T°</th></tr></thead>
          <tbody>{hist.atenciones.slice(0, 20).map((a) => (
            <tr key={a.id}><td>{new Date(a.fecha).toLocaleDateString("es-CL")}</td><td>{a.diagnostico}</td><td>{a.tratamiento}</td><td>{a.peso_kg}</td><td>{a.temperatura}</td></tr>
          ))}</tbody>
        </table>
      )}

      <h2>Vacunas</h2>
      {hist.vacunas.length === 0 ? <p className="sutil">Sin vacunas registradas.</p> : (
        <table>
          <thead><tr><th>Vacuna</th><th>Lote</th><th>Aplicación</th><th>Próxima dosis</th></tr></thead>
          <tbody>{hist.vacunas.map((v) => (
            <tr key={v.id}><td>{v.nombre}</td><td>{v.lote}</td><td>{new Date(v.fecha_aplicacion).toLocaleDateString("es-CL")}</td><td>{v.proxima_dosis ? new Date(v.proxima_dosis).toLocaleDateString("es-CL") : "—"}</td></tr>
          ))}</tbody>
        </table>
      )}

      <h2>Documentos adjuntos</h2>
      <form className="fila" onSubmit={subir}>
        <input type="file" onChange={(e) => setArchivo(e.target.files[0])} />
        <button type="submit">Subir</button>
      </form>
      <ul>
        {adjuntos.map((a) => (
          <li key={a.id}><button className="enlace" onClick={() => descargar(a)}>{a.nombre_original}</button> <span className="sutil">({Math.round(a.tamano_bytes / 1024)} KB)</span></li>
        ))}
      </ul>
    </>
  );
}
