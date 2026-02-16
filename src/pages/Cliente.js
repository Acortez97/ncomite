import { useContext } from "react";
import { AuthContext } from "../context/authContext";

export default function ClienteHome() {
    const { user } = useContext(AuthContext);

    // Si no hay usuario (por seguridad)
    if (!user) {
        return (
            <div className="home">
                <h1>Bienvenido</h1>
                <p>Cargando información...</p>
            </div>
        );
    }

    return (
        <div className="home">
            <h1>
                Bienvenido {user.Nombre} {user.Apellido_pat}
            </h1>
            <p>Esta es tu área de cliente.</p>
        </div>
    );
}
