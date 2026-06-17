// ─────────────────────────────────────────────
// SESIÓN
// ─────────────────────────────────────────────

const usuarioSesion = JSON.parse(localStorage.getItem("usuario") || "null");

// ─────────────────────────────────────────────
// ELEMENTOS
// ─────────────────────────────────────────────

const contenedor      = document.getElementById("contenedorHistorias");
const mensajeVacio    = document.getElementById("mensajeVacio");
const mensajeCargando = document.getElementById("mensajeCargando");

// ─────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {

    if (!usuarioSesion || !usuarioSesion.id) {
        mensajeCargando.style.display = "none";
        mensajeVacio.style.display    = "flex";
        mensajeVacio.querySelector("h2").textContent =
            "Inicia sesión para ver tu biblioteca";
        mensajeVacio.querySelector("p").textContent =
            "Necesitas una cuenta para guardar historias.";
        return;
    }

    cargarBiblioteca();
});

// ─────────────────────────────────────────────
// CARGAR BIBLIOTECA DEL USUARIO
// ─────────────────────────────────────────────

async function cargarBiblioteca() {
    try {
        const res = await fetch(`/biblioteca/${usuarioSesion.id}`);

        if (!res.ok) {
            throw new Error(`Error del servidor: ${res.status}`);
        }

        const historias = await res.json();

        mensajeCargando.style.display = "none";
        contenedor.innerHTML          = "";

        if (!Array.isArray(historias) || historias.length === 0) {
            mensajeVacio.style.display = "flex";
            return;
        }

        mensajeVacio.style.display = "none";
        historias.forEach(historia => renderCard(historia));

    } catch (err) {
        console.error("Error al cargar biblioteca:", err);
        mensajeCargando.style.display = "none";
        mensajeVacio.style.display    = "flex";
        mensajeVacio.querySelector("h2").textContent = "Algo salió mal";
        mensajeVacio.querySelector("p").textContent  =
            "Error al cargar tu biblioteca. Verifica tu conexión.";
    }
}

// ─────────────────────────────────────────────
// RENDERIZAR CARD DE HISTORIA
// ─────────────────────────────────────────────

function renderCard(historia) {
    const card      = document.createElement("div");
    card.className  = "card-historia";
    card.dataset.id = historia.id;

    const portadaSrc = historia.portada && historia.portada.trim() !== ""
        ? historia.portada
        : "./imagenes/Asa-mitaka.jpg";

    const tituloSeguro = escapeHtml(historia.titulo || "Sin título");
    const autorSeguro  = escapeHtml(historia.nombre_autor || "Autor desconocido");
    const totalCaps    = historia.total_capitulos ?? 0;

    card.innerHTML = `
        <div class="card-portada">
            <img
                src="${portadaSrc}"
                alt="${tituloSeguro}"
                onerror="this.src='./imagenes/Asa-mitaka.jpg'">
            <button
                class="btn-quitar"
                title="Quitar de la biblioteca"
                data-id="${historia.id}">
                <i class="fa-solid fa-bookmark"></i>
            </button>
        </div>
        <div class="card-info">
            <h3>${tituloSeguro}</h3>
            <p class="autor">
                <i class="fa-solid fa-user"></i>
                ${autorSeguro}
            </p>
            <p class="capitulos">
                <i class="fa-solid fa-list"></i>
                ${totalCaps} capítulo${totalCaps === 1 ? "" : "s"}
            </p>
        </div>
    `;

    // Quitar de biblioteca
    card.querySelector(".btn-quitar").addEventListener("click", (e) => {
        e.stopPropagation();
        quitarDeBiblioteca(historia.id, card);
    });

    // Navegar a la historia
    card.addEventListener("click", () => {
        localStorage.setItem("historiaSeleccionada", historia.id);
        location.href = "Mostrar_historia.html";
    });

    contenedor.appendChild(card);
}

// ─────────────────────────────────────────────
// QUITAR HISTORIA DE LA BIBLIOTECA
// ─────────────────────────────────────────────

async function quitarDeBiblioteca(historiaId, card) {

    if (!confirm("¿Quitar esta historia de tu biblioteca?")) return;

    try {
        const res = await fetch(`/biblioteca/${usuarioSesion.id}/${historiaId}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            throw new Error(`Error del servidor: ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
            card.remove();

            if (contenedor.children.length === 0) {
                mensajeVacio.style.display = "flex";
            }
        } else {
            alert("Error al quitar la historia: " + (data.error || "desconocido"));
        }

    } catch (err) {
        console.error("Error al quitar de biblioteca:", err);
        alert("No se pudo conectar con el servidor.");
    }
}

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────

// Previene XSS al insertar texto dinámico como innerHTML
function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;")
        .replace(/'/g,  "&#039;");
}