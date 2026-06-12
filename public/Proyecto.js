// ─────────────────────────────────────────────
// PROYECTO.JS — Página principal de READZONE
// ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {

    // ── Verificar sesión ──────────────────────────────────────
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if (!usuario) {
        window.location.href = "Login_Proyecto.html";
        return;
    }

    // ── Foto de perfil ────────────────────────────────────────
    const fotoPerfil = document.getElementById("fotoPerfilPrincipal");
    if (fotoPerfil) {
        fotoPerfil.src = (usuario.foto_perfil && usuario.foto_perfil.trim() !== "")
            ? usuario.foto_perfil
            : "./imagenes/foto-default.png";
    }

    // ── Links del menú ────────────────────────────────────────
    const linkPerfil = document.getElementById("linkPerfil");
    if (linkPerfil) {
        linkPerfil.href = `User_dise.html?id=${usuario.id}`;
    }

    const linkBiblioteca = document.getElementById("linkBiblioteca");
    if (linkBiblioteca) {
        linkBiblioteca.href = `Libreria_historias.html?id=${usuario.id}`;
    }

    // ── Cerrar sesión ─────────────────────────────────────────
    const btnCerrar = document.getElementById("cerrarSesion");
    if (btnCerrar) {
        btnCerrar.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("usuario");
            window.location.href = "Presentacion.html";
        });
    }

    // ── Cargar historias desde el servidor ────────────────────
    try {
        const respuesta = await fetch("/historias");

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        const historiasPopulares = datos.populares || [];
        const historiasRecientes = datos.recientes || [];

        const contenedorPopulares = document.getElementById("populares");
        const contenedorRecientes = document.getElementById("recientes");

        if (!contenedorPopulares || !contenedorRecientes) return;

        contenedorPopulares.innerHTML = "";
        contenedorRecientes.innerHTML = "";

        if (historiasPopulares.length === 0) {
            contenedorPopulares.innerHTML =
                `<p style="color:#64748b; padding:10px;">No hay historias populares aún.</p>`;
        } else {
            historiasPopulares.forEach((h) => {
                contenedorPopulares.appendChild(crearTarjetaHistoria(h));
            });
        }

        if (historiasRecientes.length === 0) {
            contenedorRecientes.innerHTML =
                `<p style="color:#64748b; padding:10px;">No hay historias recientes aún.</p>`;
        } else {
            historiasRecientes.forEach((h) => {
                contenedorRecientes.appendChild(crearTarjetaHistoria(h));
            });
        }

    } catch (error) {
        console.error("Error cargando historias:", error);

        const msg = `<p style="color:#ef4444; padding:10px;">
                        Error al cargar historias. Intenta recargar la página.
                    </p>`;

        const contenedorPopulares = document.getElementById("populares");
        const contenedorRecientes = document.getElementById("recientes");
        if (contenedorPopulares) contenedorPopulares.innerHTML = msg;
        if (contenedorRecientes) contenedorRecientes.innerHTML = msg;
    }
});

// ─────────────────────────────────────────────
// CREAR TARJETA DE HISTORIA
// CORRECCIÓN CLAVE: guarda el ID en localStorage con la clave
// "historiaSeleccionada" y navega a Mostrar_historia.html
// ─────────────────────────────────────────────
function crearTarjetaHistoria(h) {
    const card = document.createElement("div");
    card.className = "historia-card";

    const portada = (h.portada && h.portada.trim() !== "")
        ? h.portada
        : "./imagenes/default.jpg";

    card.innerHTML = `
        <img
            src="${portada}"
            alt="Portada de ${h.titulo}"
            onerror="this.src='https://via.placeholder.com/180x260?text=Sin+portada'">
        <h4>${h.titulo}</h4>
        <p>${h.nombre_autor ? "Por " + h.nombre_autor : ""}</p>
        <p>👁 ${h.total_vistas || 0} lecturas</p>
    `;

    card.addEventListener("click", () => {
        // Guardar el ID para que Mostrar_historia.js lo lea
        localStorage.setItem("historiaSeleccionada", h.id);
        window.location.href = "Mostrar_historia.html";
    });

    return card;
}