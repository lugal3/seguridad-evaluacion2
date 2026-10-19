import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Registro from "./pages/Registro.jsx";
import Inicio from "./pages/Inicio.jsx";
import Mascotas from "./pages/Mascotas.jsx";
import MascotaDetalle from "./pages/MascotaDetalle.jsx";
import Citas from "./pages/Citas.jsx";
import Boletas from "./pages/Boletas.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import Perfil from "./pages/Perfil.jsx";

function Privada({ children, roles }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route element={<Privada><Layout /></Privada>}>
        <Route path="/" element={<Inicio />} />
        <Route path="/mascotas" element={<Mascotas />} />
        <Route path="/mascotas/:id" element={<MascotaDetalle />} />
        <Route path="/citas" element={<Citas />} />
        <Route path="/boletas" element={<Privada roles={["admin", "recepcionista"]}><Boletas /></Privada>} />
        <Route path="/usuarios" element={<Privada roles={["admin", "recepcionista"]}><Usuarios /></Privada>} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
