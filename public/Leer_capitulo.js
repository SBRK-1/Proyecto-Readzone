// ─────────────────────────────────────────────
// DATOS PASADOS DESDE Mostrar_historia.js
// ─────────────────────────────────────────────

const historiaID      = localStorage.getItem("historiaLectura");
const capituloInicial = parseInt(localStorage.getItem("capituloInicial") || "0");

// ─────────────────────────────────────────────
// ELEMENTOS
// ─────────────────────────────────────────────

const nombreHistoriaEl  = document.getElementById("nombreHistoria");
const nombreHistoriaTop = document.getElementById("nombreHistoriaTop");
const listaCapitulosEl  = document.getElementById("listaCapitulos");
const tituloCapituloEl  = document.getElementById("tituloCapitulo");
const contenidoEl       = document.getElementById("contenidoCapitulo");
const btnAnterior       = document.getElementById("btnAnterior");
const btnSiguiente      = document.getElementById("btnSiguiente");
const btnVolver         = document.getElementById("btnVolver");
const btnToggleSidebar  = document.getElementById("btnToggleSidebar");
const btnCerrarSidebar  = document.getElementById("btnCerrarSidebar");
const sidebar           = document.getElementById("sidebar");
const overlay           = document.getElementById("overlay");

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────

let capitulos    = [];
let indiceActual = capituloInicial;

// ─────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", async () => {

    if (!historiaID) {
        document.querySelector(".lector").innerHTML =
            `<p style="color:red;padding:40px;">
                No se encontró la historia. <a href="index.html">Volver al inicio</a>
            </p>`;
        return;
    }

    await cargarHistoria();
    await cargarCapitulos();
});

// ─────────────────────────────────────────────
// CARGAR NOMBRE DE LA HISTORIA
// ─────────────────────────────────────────────

async function cargarHistoria() {
    try {
        const res      = await fetch(`/historia/${historiaID}`);
        const historia = await res.json();

        const titulo = historia.titulo || "Historia";
        nombreHistoriaEl.textContent  = titulo;
        nombreHistoriaTop.textContent = titulo;
        document.title = titulo + " - READZONE";

    } catch (err) {
        console.error("Error al cargar historia:", err);
        nombreHistoriaEl.textContent  = "Error al cargar";
        nombreHistoriaTop.textContent = "Error al cargar";
    }
}

// ─────────────────────────────────────────────
// CARGAR LISTA DE CAPÍTULOS Y MOSTRAR EL INICIAL
// ─────────────────────────────────────────────

async function cargarCapitulos() {
    try {
        const res = await fetch(`/capitulos/${historiaID}`);
        capitulos  = await res.json();

        listaCapitulosEl.innerHTML = "";

        if (!capitulos.length) {
            listaCapitulosEl.innerHTML =
                `<p style="padding:12px;font-size:14px;">Sin capítulos.</p>`;
            return;
        }

        // Construir sidebar
        capitulos.forEach((cap, index) => {
            const div = document.createElement("div");
            div.className     = "capitulo-item";
            div.dataset.index = index;
            div.textContent   = cap.titulo || `Capítulo ${index + 1}`;

            div.addEventListener("click", () => {
                mostrarCapitulo(index);
                cerrarSidebar(); // cerrar en móvil al seleccionar
            });

            listaCapitulosEl.appendChild(div);
        });

        // Abrir el capítulo inicial
        const inicio = Math.min(indiceActual, capitulos.length - 1);
        mostrarCapitulo(inicio);

    } catch (err) {
        console.error("Error al cargar capítulos:", err);
        listaCapitulosEl.innerHTML =
            `<p style="color:red;padding:12px;">Error al cargar capítulos.</p>`;
    }
}

// ─────────────────────────────────────────────
// MOSTRAR UN CAPÍTULO ESPECÍFICO
// ─────────────────────────────────────────────

async function mostrarCapitulo(index) {

    indiceActual = index;
    const cap    = capitulos[index];

    tituloCapituloEl.textContent = cap.titulo || `Capítulo ${index + 1}`;

    // Mostrar spinner mientras carga
    contenidoEl.innerHTML =
        `<p class="texto-cargando">
            <i class="fa-solid fa-spinner fa-spin"></i> Cargando contenido...
        </p>`;

    // Cargar contenido fresco del servidor
    try {
        const res     = await fetch(`/capitulo/${cap.id}`);
        const detalle = await res.json();

        contenidoEl.innerHTML = detalle.contenido
            ? detalle.contenido
            : "<p>Este capítulo no tiene contenido aún.</p>";

    } catch (err) {
        console.error("Error al cargar capítulo:", err);
        contenidoEl.innerHTML = "<p>Error al cargar el contenido.</p>";
    }

    // Marcar activo en sidebar
    document.querySelectorAll(".capitulo-item").forEach(item => {
        item.classList.remove("capitulo-activo");
    });

    const itemActivo = document.querySelector(`.capitulo-item[data-index="${index}"]`);
    if (itemActivo) {
        itemActivo.classList.add("capitulo-activo");
        itemActivo.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // Botones de navegación
    btnAnterior.style.display  = index > 0 ? "inline-flex" : "none";
    btnSiguiente.style.display = "inline-flex";

    // Si es el último capítulo, cambiar texto del botón
    if (index === capitulos.length - 1) {
        btnSiguiente.innerHTML =
            `<i class="fa-solid fa-check"></i> Fin de la historia`;
        btnSiguiente.disabled = true;
    } else {
        btnSiguiente.innerHTML =
            `Siguiente capítulo <i class="fa-solid fa-chevron-right"></i>`;
        btnSiguiente.disabled = false;
    }

    // Scroll al inicio del lector
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Guardar progreso
    guardarProgreso(cap.id);
}

// ─────────────────────────────────────────────
// NAVEGACIÓN ANTERIOR / SIGUIENTE
// ─────────────────────────────────────────────

btnAnterior.addEventListener("click", () => {
    if (indiceActual > 0) mostrarCapitulo(indiceActual - 1);
});

btnSiguiente.addEventListener("click", () => {
    if (indiceActual < capitulos.length - 1) mostrarCapitulo(indiceActual + 1);
});

// ─────────────────────────────────────────────
// VOLVER A LA HISTORIA
// ─────────────────────────────────────────────

btnVolver.addEventListener("click", () => {
    location.href = "Mostrar_historia.html";
});

// ─────────────────────────────────────────────
// SIDEBAR: abrir / cerrar
// ─────────────────────────────────────────────

function abrirSidebar() {
    sidebar.classList.add("abierto");
    overlay.classList.add("visible");
}

function cerrarSidebar() {
    sidebar.classList.remove("abierto");
    overlay.classList.remove("visible");
}

btnToggleSidebar.addEventListener("click", () => {
    if (sidebar.classList.contains("abierto")) {
        cerrarSidebar();
    } else {
        abrirSidebar();
    }
});

btnCerrarSidebar.addEventListener("click", cerrarSidebar);
overlay.addEventListener("click", cerrarSidebar);

// ─────────────────────────────────────────────
// GUARDAR PROGRESO DE LECTURA EN EL SERVIDOR
// ─────────────────────────────────────────────

async function guardarProgreso(capituloId) {
    try {
        const usuarioSesion = JSON.parse(
            sessionStorage.getItem("usuarioREADZONE") ||
            localStorage.getItem("usuarioREADZONE") ||
            "null"
        );

        if (!usuarioSesion) return; // solo guardar si hay sesión

        await fetch("/progreso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario_id:  usuarioSesion.id,
                capitulo_id: capituloId
            })
        });

    } catch (err) {
        console.error("Error al guardar progreso:", err);
    }
}