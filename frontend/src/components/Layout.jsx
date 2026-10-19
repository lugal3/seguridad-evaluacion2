import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

const enlaces = [
  { to: "/", texto: "Inicio", roles: null },
  { to: "/mascotas", texto: "Mascotas", roles: null },
  { to: "/citas", texto: "Citas", roles: null },
  { to: "/boletas", texto: "Boletas", roles: ["admin", "recepcionista"] },
  { to: "/usuarios", texto: "Usuarios", roles: ["admin", "recepcionista"] },
  { to: "/perfil", texto: "Mi perfil", roles: null },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="app">
      <header className="topbar">
        <span className="marca">🐾 HuellitasVet</span>
        <nav>
          {enlaces
            .filter((e) => !e.roles || e.roles.includes(usuario.rol))
            .map((e) => (
              <NavLink key={e.to} to={e.to} end={e.to === "/"}>{e.texto}</NavLink>
            ))}
        </nav>
        <span className="usuario">
          {usuario.nombre} ({usuario.rol})
          <button className="secundario" onClick={() => { logout(); navigate("/login"); }}>Salir</button>
        </span>
      </header>
      <main className="contenido"><Outlet /></main>
    </div>
  );
}
