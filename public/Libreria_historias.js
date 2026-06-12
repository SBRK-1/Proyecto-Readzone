// ─────────────────────────────────────────────
// SESIÓN
// ─────────────────────────────────────────────

// CORRECCIÓN: clave unificada "usuario", igual que el resto de la app
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

    if (!usuarioSesion) {
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
        const res       = await fetch(`/biblioteca/${usuarioSesion.id}`);
        const historias = await res.json();

        mensajeCargando.style.display = "none";
        contenedor.innerHTML          = "";

        if (!historias.length) {
            mensajeVacio.style.display = "flex";
            return;
        }

        mensajeVacio.style.display = "none";
        historias.forEach(historia => renderCard(historia));

    } catch (err) {
        console.error("Error al cargar biblioteca:", err);
        mensajeCargando.style.display = "none";
        mensajeVacio.style.display    = "flex";
        mensajeVacio.querySelector("p").textContent =
            "Error al cargar tu biblioteca. Verifica tu conexión.";
    }
}

// ─────────────────────────────────────────────
// RENDERIZAR CARD DE HISTORIA
// ─────────────────────────────────────────────

function renderCard(historia) {
    const card     = document.createElement("div");
    card.className = "card-historia";
    card.dataset.id = historia.id;

    card.innerHTML = `
        <div class="card-portada">
            <img
                src="${historia.portada || './imagenes/Asa-mitaka.jpg'}"
                alt="${historia.titulo}"
                onerror="this.src='./imagenes/Asa-mitaka.jpg'">

            <button
                class="btn-quitar"
                title="Quitar de la biblioteca"
                onclick="quitarDeBiblioteca(${historia.id}, this)">
                <i class="fa-solid fa-bookmark"></i>
            </button>
        </div>

        <div class="card-info">
            <h3>${historia.titulo}</h3>
            <p class="autor">
                <i class="fa-solid fa-user"></i>
                ${historia.nombre_autor || "Autor desconocido"}
            </p>
            <p class="capitulos">
                <i class="fa-solid fa-list"></i>
                ${historia.total_capitulos || 0} capítulos
            </p>
        </div>
    `;

    card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-quitar")) return;
        localStorage.setItem("historiaSeleccionada", historia.id);
        location.href = "Mostrar_historia.html";
    });

    contenedor.appendChild(card);
}

// ─────────────────────────────────────────────
// QUITAR HISTORIA DE LA BIBLIOTECA
// ─────────────────────────────────────────────

async function quitarDeBiblioteca(historiaId, boton) {

    if (!confirm("¿Quitar esta historia de tu biblioteca?")) return;

    try {
        const res  = await fetch(`/biblioteca/${usuarioSesion.id}/${historiaId}`, {
            method: "DELETE"
        });
        const data = await res.json();

        if (data.success) {
            const card = boton.closest(".card-historia");
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