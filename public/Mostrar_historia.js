// ─────────────────────────────────────────────
// ID DE LA HISTORIA (guardado al hacer clic en una card)
// ─────────────────────────────────────────────

const historiaID = localStorage.getItem("historiaSeleccionada");

// ─────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", async () => {

    if (!historiaID) {
        document.querySelector(".contenedor").innerHTML =
            `<p style="padding:40px;color:red;">
                No se encontró la historia. <a href="Proyecto.html">Vuelve al inicio.</a>
            </p>`;
        return;
    }

    await cargarHistoria();
    await cargarCapitulos();
    await registrarVista();
    iniciarTabs();
    iniciarBtnLeer();   // ← se registra aquí, cuando el DOM ya existe
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
        if (historia.etiquetas) {
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
        const resVistas  = await fetch(`/historia/${historiaID}/vistas`);
        const dataVistas = await resVistas.json();
        document.getElementById("vistas").textContent = dataVistas.total || 0;

    } catch (err) {
        console.error("Error al cargar historia:", err);
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

        document.getElementById("cantidadCapitulos").textContent =
            capitulos.length;

        lista.innerHTML = "";

        if (!capitulos.length) {
            lista.innerHTML =
                `<p style="padding:16px;">Esta historia no tiene capítulos aún.</p>`;
            return;
        }

        capitulos.forEach((capitulo, index) => {
            const div = document.createElement("div");
            div.className = "capitulo";

            const fecha = capitulo.fecha_creacion
                ? new Date(capitulo.fecha_creacion).toLocaleDateString()
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
// CORRECCIÓN: se registra dentro de DOMContentLoaded (vía iniciarBtnLeer)
// para garantizar que el elemento ya existe en el DOM
// ─────────────────────────────────────────────

function iniciarBtnLeer() {
    const btn = document.getElementById("btnLeer");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        try {
            const res       = await fetch(`/capitulos/${historiaID}`);
            const capitulos = await res.json();

            if (!capitulos.length) {
                alert("Esta historia no tiene capítulos todavía.");
                return;
            }

            localStorage.setItem("historiaLectura", historiaID);
            localStorage.setItem("capituloLectura", capitulos[0].id);
            localStorage.setItem("capituloInicial", 0);
            location.href = "Leer_capitulo.html";

        } catch (err) {
            console.error("Error al iniciar lectura:", err);
            alert("No se pudo conectar con el servidor.");
        }
    });
}

// ─────────────────────────────────────────────
// REGISTRAR VISTA
// ─────────────────────────────────────────────

async function registrarVista() {
    try {
        // Busca la sesión en sessionStorage primero, luego en localStorage
        const usuarioSesion = JSON.parse(
            sessionStorage.getItem("usuarioREADZONE") ||
            localStorage.getItem("usuarioREADZONE") ||
            localStorage.getItem("usuario") ||   // ← clave usada en el login
            "null"
        );

        await fetch("/vista", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario_id:  usuarioSesion?.id || null,
                historia_id: historiaID
            })
        });

    } catch (err) {
        // Silencioso — no interrumpir la experiencia si falla
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