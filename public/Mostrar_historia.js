// ─────────────────────────────────────────────
// SESIÓN Y ID DE HISTORIA
// ─────────────────────────────────────────────

const historiaID    = localStorage.getItem("historiaSeleccionada");
const usuarioSesion = JSON.parse(localStorage.getItem("usuario") || "null");

// ─────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", async () => {

    if (!historiaID) {
        document.querySelector(".contenedor").innerHTML =
            `<p style="padding:40px;color:red;">
                No se encontró la historia.
                <a href="Proyecto.html">Vuelve al inicio.</a>
            </p>`;
        return;
    }

    await cargarHistoria();
    await cargarCapitulos();
    await registrarVista();
    iniciarTabs();
    iniciarBtnLeer();
    iniciarBtnBiblioteca();
});

// ─────────────────────────────────────────────
// CARGAR DATOS DE LA HISTORIA
// ─────────────────────────────────────────────

async function cargarHistoria() {
    try {
        const res      = await fetch(`/historia/${historiaID}`);
        const historia = await res.json();

        if (historia.error) {
            alert("Historia no encontrada.");
            location.href = "Proyecto.html";
            return;
        }

        // Portada
        if (historia.portada && historia.portada.trim() !== "") {
            document.getElementById("portadaHistoria").src = historia.portada;
        }

        // Título
        document.getElementById("tituloHistoria").textContent =
            historia.titulo || "Sin título";

        // Descripción
        document.getElementById("descripcionHistoria").textContent =
            historia.descripcion || "Sin descripción.";

        // Etiquetas
        if (historia.etiquetas && historia.etiquetas.trim() !== "") {
            document.getElementById("etiquetasHistoria").textContent =
                historia.etiquetas;
        }

        // Badges
        if (historia.contenido_adulto) {
            document.getElementById("badgeAdulto").style.display = "inline";
        }
        if (historia.completa) {
            document.getElementById("badgeCompleta").style.display = "inline";
        }

        // Autor
        if (historia.usuario_id) {
            await cargarAutor(historia.usuario_id);
        }

        // Vistas
        try {
            const resVistas  = await fetch(`/historia/${historiaID}/vistas`);
            const dataVistas = await resVistas.json();
            document.getElementById("vistas").textContent = dataVistas.total || 0;
        } catch (e) {
            document.getElementById("vistas").textContent = 0;
        }

    } catch (err) {
        console.error("Error al cargar historia:", err);
        document.querySelector(".contenedor").innerHTML =
            `<p style="padding:40px;color:red;">
                Error al cargar la historia.
                <a href="Proyecto.html">Vuelve al inicio.</a>
            </p>`;
    }
}

// ─────────────────────────────────────────────
// CARGAR DATOS DEL AUTOR
// ─────────────────────────────────────────────

async function cargarAutor(usuarioId) {
    try {
        const res   = await fetch(`/usuario/${usuarioId}`);
        const autor = await res.json();

        document.getElementById("autorHistoria").textContent =
            autor.nombre || autor.usuario || "Autor desconocido";

        if (autor.foto_perfil && autor.foto_perfil.trim() !== "") {
            document.getElementById("fotoAutor").src = autor.foto_perfil;
        }

    } catch (err) {
        console.error("Error al cargar autor:", err);
        document.getElementById("autorHistoria").textContent = "Autor desconocido";
    }
}

// ─────────────────────────────────────────────
// CARGAR CAPÍTULOS
// ─────────────────────────────────────────────

async function cargarCapitulos() {
    const lista = document.getElementById("listaCapitulos");

    try {
        const res       = await fetch(`/capitulos/${historiaID}`);
        const capitulos = await res.json();

        // Actualizar contador de capítulos
        document.getElementById("cantidadCapitulos").textContent = capitulos.length;
        lista.innerHTML = "";

        if (!capitulos.length) {
            lista.innerHTML =
                `<p style="padding:16px;">Esta historia no tiene capítulos aún.</p>`;
            return;
        }

        capitulos.forEach((capitulo, index) => {
            const div     = document.createElement("div");
            div.className = "capitulo";

            const fecha = capitulo.fecha_creacion
                ? new Date(capitulo.fecha_creacion).toLocaleDateString("es-ES")
                : "";

            div.innerHTML = `
                <div class="capitulo-info">
                    <strong>${capitulo.titulo || "Sin título"}</strong>
                    <small>${fecha}</small>
                </div>
                <i class="fa-solid fa-chevron-right"></i>
            `;

            div.addEventListener("click", () => {
                localStorage.setItem("historiaLectura", historiaID);
                localStorage.setItem("capituloLectura", capitulo.id);
                localStorage.setItem("capituloInicial", index);
                location.href = "Leer_capitulo.html";
            });

            lista.appendChild(div);
        });

    } catch (err) {
        console.error("Error al cargar capítulos:", err);
        lista.innerHTML =
            `<p style="color:red;padding:16px;">Error al cargar capítulos.</p>`;
    }
}

// ─────────────────────────────────────────────
// BOTÓN COMENZAR LECTURA
// ─────────────────────────────────────────────

function iniciarBtnLeer() {
    const btn = document.getElementById("btnLeer");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        btn.disabled    = true;
        btn.textContent = "Cargando...";

        try {
            const res       = await fetch(`/capitulos/${historiaID}`);
            const capitulos = await res.json();

            if (!capitulos.length) {
                alert("Esta historia no tiene capítulos todavía.");
                btn.disabled    = false;
                btn.innerHTML   = `<i class="fa-solid fa-book-open"></i> Comenzar lectura`;
                return;
            }

            localStorage.setItem("historiaLectura", historiaID);
            localStorage.setItem("capituloLectura", capitulos[0].id);
            localStorage.setItem("capituloInicial", 0);
            location.href = "Leer_capitulo.html";

        } catch (err) {
            console.error("Error al iniciar lectura:", err);
            alert("No se pudo conectar con el servidor.");
            btn.disabled  = false;
            btn.innerHTML = `<i class="fa-solid fa-book-open"></i> Comenzar lectura`;
        }
    });
}

// ─────────────────────────────────────────────
// BOTÓN AGREGAR A BIBLIOTECA
// ─────────────────────────────────────────────

function iniciarBtnBiblioteca() {
    const btn = document.getElementById("btnBiblioteca");
    if (!btn) return;

    // Sin sesión: avisar al hacer clic
    if (!usuarioSesion) {
        btn.addEventListener("click", () => {
            alert("Inicia sesión para agregar historias a tu biblioteca.");
        });
        return;
    }

    btn.addEventListener("click", async () => {

        btn.disabled    = true;
        btn.textContent = "Guardando...";

        try {
            const res  = await fetch("/biblioteca", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuario_id:  usuarioSesion.id,
                    historia_id: parseInt(historiaID)
                })
            });

            const data = await res.json();

            if (data.success) {
                if (data.yaExiste) {
                    // Ya estaba guardada
                    btn.disabled = false;
                    btn.innerHTML =
                        `<i class="fa-solid fa-bookmark"></i> Ya en tu biblioteca`;
                    btn.classList.add("guardada");
                } else {
                    // Recién agregada — deshabilitar para no duplicar
                    btn.innerHTML =
                        `<i class="fa-solid fa-check"></i> Agregada a biblioteca`;
                    btn.classList.add("guardada");
                }
            } else {
                alert("No se pudo agregar: " + (data.error || "Error desconocido."));
                btn.disabled  = false;
                btn.innerHTML =
                    `<i class="fa-solid fa-bookmark"></i> Agregar a biblioteca`;
            }

        } catch (err) {
            console.error("Error al agregar a biblioteca:", err);
            alert("No se pudo conectar con el servidor.");
            btn.disabled  = false;
            btn.innerHTML =
                `<i class="fa-solid fa-bookmark"></i> Agregar a biblioteca`;
        }
    });
}

// ─────────────────────────────────────────────
// REGISTRAR VISTA
// ─────────────────────────────────────────────

async function registrarVista() {
    // El servidor requiere usuario_id e historia_id; si no hay usuario se omite
    if (!usuarioSesion) return;

    try {
        await fetch("/vista", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario_id:  usuarioSesion.id,
                historia_id: parseInt(historiaID)
            })
        });
    } catch (err) {
        // No es crítico si falla el registro de vista
        console.error("Error al registrar vista:", err);
    }
}

// ─────────────────────────────────────────────
// CAMBIO DE PESTAÑAS
// ─────────────────────────────────────────────

function iniciarTabs() {
    const botonesTabs  = document.querySelectorAll(".tab-btn");
    const tabResumen   = document.getElementById("tabResumen");
    const tabCapitulos = document.getElementById("tabCapitulos");

    botonesTabs.forEach(btn => {
        btn.addEventListener("click", () => {
            botonesTabs.forEach(b => b.classList.remove("activo"));
            btn.classList.add("activo");

            tabResumen.classList.remove("activo");
            tabCapitulos.classList.remove("activo");

            if (btn.dataset.tab === "resumen") {
                tabResumen.classList.add("activo");
            } else {
                tabCapitulos.classList.add("activo");
            }
        });
    });
}