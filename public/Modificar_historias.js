// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const API = ""; // Si el JS corre desde el mismo origen que Express, déjalo vacío

// Obtener usuario logueado desde sessionStorage/localStorage
const usuarioSesion = JSON.parse(
    sessionStorage.getItem("usuarioREADZONE") ||
    localStorage.getItem("usuarioREADZONE") ||
    "null"
);

const lista = document.getElementById("listaHistorias");

// ─────────────────────────────────────────────
// INICIO
// ─────────────────────────────────────────────

if (!usuarioSesion) {
    lista.innerHTML = `<p style="color:red; padding:20px;">
        Debes iniciar sesión para ver tus historias.
    </p>`;
} else {
    mostrarHistorias();
}

document.getElementById("crearHistoria")
    .addEventListener("click", async () => {

        if (!usuarioSesion) {
            alert("Debes iniciar sesión primero.");
            return;
        }

        try {
            const res = await fetch(`${API}/historias`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuario_id: usuarioSesion.id,
                    titulo: "Nueva Historia",
                    descripcion: "",
                    portada: "./imagenes/Asa-mitaka.jpg"
                })
            });

            const data = await res.json();

            if (data.success) {
                // Guardar qué historia y capítulo editar
                localStorage.setItem("HistoriaEditando", data.historia_id);
                localStorage.setItem("CapituloEditando", 0);
                location.href = "Escritura.html";
            } else {
                alert("Error al crear historia: " + (data.error || "desconocido"));
            }

        } catch (err) {
            console.error("Error al crear historia:", err);
            alert("No se pudo conectar con el servidor.");
        }
    });

// ─────────────────────────────────────────────
// MOSTRAR HISTORIAS
// ─────────────────────────────────────────────

async function mostrarHistorias() {

    lista.innerHTML = `<p style="padding:20px;">Cargando historias...</p>`;

    try {
        const res = await fetch(`${API}/historias/${usuarioSesion.id}`);
        const historias = await res.json();

        lista.innerHTML = "";

        if (!historias.length) {
            lista.innerHTML = `<p style="padding:20px;">
                No tienes historias aún. ¡Crea una nueva!
            </p>`;
            return;
        }

        historias.forEach((historia) => {
            const card = document.createElement("div");
            card.classList.add("card-historia");

            const fecha = historia.fecha_creacion
                ? new Date(historia.fecha_creacion).toLocaleDateString()
                : "Sin fecha";

            card.innerHTML = `
                <img src="${historia.portada || './imagenes/Asa-mitaka.jpg'}"
                    class="portada"
                    onerror="this.src='./imagenes/Asa-mitaka.jpg'">

                <div class="info">
                    <h2>${historia.titulo}</h2>
                    <p class="fecha">Última edición: ${fecha}</p>

                    <div class="acciones">
                        <button onclick="abrirMenu(${historia.id})">
                            Continuar
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>

                        <div class="menu" id="menu${historia.id}">
                            <button onclick="editarHistoria(${historia.id})">
                                Editar historia
                            </button>
                            <button onclick="eliminarHistoria(${historia.id})">
                                Eliminar historia
                            </button>
                        </div>
                    </div>
                </div>

                <!-- SIGUE ESCRIBIENDO -->
                <div class="seguir-escribiendo">
                    <button class="btn-seguir"
                            onclick="mostrarCapitulos(${historia.id})">
                        Sigue escribiendo
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>

                    <div class="menu-capitulos"
                        id="capitulos${historia.id}">

                        <div class="lista-capitulos"
                            id="listaCapitulos${historia.id}">
                        </div>

                        <button class="btn-nueva-parte"
                                onclick="crearCapitulo(${historia.id})">
                            <i class="fa-solid fa-plus"></i>
                            Parte Nueva
                        </button>
                    </div>
                </div>
            `;

            lista.appendChild(card);
        });

    } catch (err) {
        console.error("Error al cargar historias:", err);
        lista.innerHTML = `<p style="color:red; padding:20px;">
            Error al cargar historias. Verifica tu conexión.
        </p>`;
    }
}

// ─────────────────────────────────────────────
// MENÚ PRINCIPAL DE LA CARD
// ─────────────────────────────────────────────

function abrirMenu(historiaId) {
    const menu = document.getElementById(`menu${historiaId}`);
    menu.style.display =
        menu.style.display === "block" ? "none" : "block";
}

// ─────────────────────────────────────────────
// EDITAR HISTORIA
// ─────────────────────────────────────────────

function editarHistoria(historiaId) {
    localStorage.setItem("HistoriaEditando", historiaId);
    localStorage.setItem("CapituloEditando", 0);
    location.href = "Escritura.html";
}

// ─────────────────────────────────────────────
// ELIMINAR HISTORIA
// ─────────────────────────────────────────────

async function eliminarHistoria(historiaId) {

    if (!confirm("¿Eliminar esta historia y todos sus capítulos?")) return;

    try {
        const res = await fetch(`${API}/historias/${historiaId}`, {
            method: "DELETE"
        });

        const data = await res.json();

        if (data.success) {
            mostrarHistorias();
        } else {
            alert("Error al eliminar: " + (data.error || "desconocido"));
        }

    } catch (err) {
        console.error("Error al eliminar historia:", err);
        alert("No se pudo conectar con el servidor.");
    }
}

// ─────────────────────────────────────────────
// MENÚ DE CAPÍTULOS
// ─────────────────────────────────────────────

function mostrarCapitulos(historiaId) {
    const menu = document.getElementById(`capitulos${historiaId}`);

    if (menu.style.display === "block") {
        menu.style.display = "none";
        return;
    }

    menu.style.display = "block";
    cargarCapitulos(historiaId);
}

// ─────────────────────────────────────────────
// CARGAR CAPÍTULOS DESDE EL SERVIDOR
// ─────────────────────────────────────────────

async function cargarCapitulos(historiaId) {

    const listaEl = document.getElementById(`listaCapitulos${historiaId}`);
    listaEl.innerHTML = `<p style="padding:8px;font-size:13px;">Cargando...</p>`;

    try {
        const res = await fetch(`${API}/capitulos/${historiaId}`);
        const capitulos = await res.json();

        listaEl.innerHTML = "";

        if (!capitulos.length) {
            listaEl.innerHTML = `<p style="padding:8px;font-size:13px;">
                Sin capítulos aún.
            </p>`;
            return;
        }

        capitulos.forEach((cap) => {
            const fecha = cap.fecha_creacion
                ? new Date(cap.fecha_creacion).toLocaleString()
                : "";

            listaEl.innerHTML += `
                <div class="capitulo-item"
                    onclick="abrirCapitulo(${historiaId}, ${cap.id})">
                    <strong>${cap.titulo || "Sin título"}</strong>
                    <br>
                    <small>${fecha}</small>
                </div>
            `;
        });

    } catch (err) {
        console.error("Error al cargar capítulos:", err);
        listaEl.innerHTML = `<p style="color:red;font-size:13px;padding:8px;">
            Error al cargar capítulos.
        </p>`;
    }
}

// ─────────────────────────────────────────────
// CREAR CAPÍTULO NUEVO
// ─────────────────────────────────────────────

async function crearCapitulo(historiaId) {

    try {
        // Primero contar cuántos capítulos hay para el número
        const res = await fetch(`${API}/capitulos/${historiaId}`);
        const capitulos = await res.json();

        const numero = capitulos.length + 1;
        const titulo = numero === 1 ? "Prólogo" : `Parte ${numero}`;

        const resCreate = await fetch(`${API}/capitulos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                historia_id: historiaId,
                titulo: titulo,
                contenido: "",
                numero_capitulo: numero
            })
        });

        const data = await resCreate.json();

        if (data.success) {
            // Abrir directamente el nuevo capítulo en el editor
            localStorage.setItem("HistoriaEditando", historiaId);
            localStorage.setItem("CapituloEditando", data.capitulo_id);
            location.href = "Escritura.html";
        } else {
            alert("Error al crear capítulo: " + (data.error || "desconocido"));
        }

    } catch (err) {
        console.error("Error al crear capítulo:", err);
        alert("No se pudo conectar con el servidor.");
    }
}

// ─────────────────────────────────────────────
// ABRIR CAPÍTULO EN EL EDITOR
// ─────────────────────────────────────────────

function abrirCapitulo(historiaId, capituloId) {
    localStorage.setItem("HistoriaEditando", historiaId);
    localStorage.setItem("CapituloEditando", capituloId);
    location.href = "Escritura.html";
}