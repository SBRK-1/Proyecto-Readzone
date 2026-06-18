// ─────────────────────────────────────────────
// BUSQUEDA_HISTORIAS.JS
// Maneja la página de resultados de búsqueda
// ─────────────────────────────────────────────

// ESTADO GLOBAL
let todosLosResultados = { historias: [], usuarios: [] };
let tabActual = "historias";

// ─────────────────────────────────────────────
// AL CARGAR LA PÁGINA: leer ?q= de la URL
// ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const query  = params.get("q") || "";

    const buscador = document.getElementById("buscador");
    if (buscador) buscador.value = query;

    if (query.trim() !== "") {
        document.getElementById("tituloBusqueda").textContent =
            `Resultados para: "${query}"`;
        buscarEnServidor(query);
    } else {
        document.getElementById("tituloBusqueda").textContent =
            "Escribe algo para buscar";
    }

    if (buscador) {
        buscador.addEventListener("keypress", (e) => {
            if (e.key === "Enter") ejecutarBusqueda();
        });
    }
});

// ─────────────────────────────────────────────
// EJECUTAR BÚSQUEDA (botón o Enter)
// ─────────────────────────────────────────────

function ejecutarBusqueda() {
    const texto = document.getElementById("buscador").value.trim();

    if (texto === "") {
        alert("Escribe algo para buscar");
        return;
    }

    const nuevaURL = `Busqueda_historias.html?q=${encodeURIComponent(texto)}`;
    window.history.pushState({}, "", nuevaURL);

    document.getElementById("tituloBusqueda").textContent =
        `Resultados para: "${texto}"`;

    buscarEnServidor(texto);
}

// ─────────────────────────────────────────────
// LLAMADA AL BACKEND
// ─────────────────────────────────────────────

async function buscarEnServidor(query) {
    mostrarCargando(true);
    limpiarResultados();

    try {
        const res = await fetch(`/buscar?q=${encodeURIComponent(query)}`);

        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }

        const data = await res.json();

        todosLosResultados = {
            historias: data.historias || [],
            usuarios:  data.usuarios  || []
        };

        actualizarBadges();
        aplicarFiltros();

    } catch (err) {
        console.error("Error al buscar:", err);
        mostrarSinResultados(true);
    } finally {
        mostrarCargando(false);
    }
}

// ─────────────────────────────────────────────
// APLICAR FILTROS Y ORDEN (sin nueva petición al servidor)
// ─────────────────────────────────────────────

function aplicarFiltros() {
    const tipoRadio   = document.querySelector('input[name="tipo"]:checked');
    const ordenRadio  = document.querySelector('input[name="orden"]:checked');
    const checkCompleta  = document.getElementById("filtroCompleta");
    const checkProgreso  = document.getElementById("filtroEnProgreso");

    if (!tipoRadio || !ordenRadio || !checkCompleta || !checkProgreso) return;

    const tipo         = tipoRadio.value;
    const orden        = ordenRadio.value;
    const soloCompleta = checkCompleta.checked;
    const soloProgreso = checkProgreso.checked;

    let historias = [...todosLosResultados.historias];
    let usuarios  = [...todosLosResultados.usuarios];

    // Filtro estado
    if (soloCompleta && !soloProgreso) {
        historias = historias.filter(h => h.completa == 1 || h.completa === true);
    } else if (soloProgreso && !soloCompleta) {
        historias = historias.filter(h => h.completa == 0 || h.completa === false);
    }

    // Orden
    if (orden === "populares") {
        historias.sort((a, b) => (b.total_vistas || 0) - (a.total_vistas || 0));
    } else {
        historias.sort((a, b) =>
            new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    }

    // Qué sección mostrar
    const mostrarHistorias = tipo === "todo" || tipo === "historias";
    const mostrarUsuarios  = tipo === "todo" || tipo === "usuarios";

    renderizarHistorias(mostrarHistorias ? historias : []);
    renderizarUsuarios(mostrarUsuarios   ? usuarios  : []);

    const tabs  = document.getElementById("tabs");
    const listaH = document.getElementById("listaHistorias");
    const listaU = document.getElementById("listaUsuarios");

    tabs.style.display = tipo === "todo" ? "flex" : "none";

    if (tipo === "historias") {
        listaH.style.display = "block";
        listaU.style.display = "none";
    } else if (tipo === "usuarios") {
        listaH.style.display = "none";
        listaU.style.display = "block";
    } else {
        // "todo" → respetar tab activo
        listaH.style.display = tabActual === "historias" ? "block" : "none";
        listaU.style.display = tabActual === "usuarios"  ? "block" : "none";
    }

    const hayAlgo = (mostrarHistorias && historias.length > 0) ||
                    (mostrarUsuarios  && usuarios.length  > 0);
    mostrarSinResultados(!hayAlgo);
}

// ─────────────────────────────────────────────
// RENDERIZAR HISTORIAS
// ─────────────────────────────────────────────

function renderizarHistorias(historias) {
    const lista = document.getElementById("listaHistorias");
    lista.innerHTML = "";

    if (historias.length === 0) return;

    historias.forEach(h => {
        const portada = (h.portada && h.portada.trim() !== "")
            ? h.portada
            : "https://via.placeholder.com/80x110?text=Sin+portada";

        const estado = (h.completa == 1 || h.completa === true)
            ? '<span class="tag completa">Completa</span>'
            : '<span class="tag progreso">En progreso</span>';

        const vistas = h.total_vistas || 0;
        const fecha  = new Date(h.fecha_creacion).toLocaleDateString("es-ES", {
            day:   "2-digit",
            month: "short",
            year:  "numeric"
        });

        const card = document.createElement("div");
        card.className = "card-historia";
        card.innerHTML = `
            <img
                src="${portada}"
                alt="Portada de ${h.titulo}"
                onerror="this.src='https://via.placeholder.com/80x110?text=?'">
            <div class="card-info">
                <h3 class="card-titulo">${h.titulo}</h3>
                <p class="card-autor">
                    <i class="fa-solid fa-pen-nib"></i>
                    ${h.nombre_autor || "Autor desconocido"}
                    <span class="card-usuario">@${h.usuario_autor || ""}</span>
                </p>
                ${h.categoria
                    ? `<p class="card-categoria">${h.categoria}</p>`
                    : ""}
                <p class="card-desc">${h.descripcion || "Sin descripción"}</p>
                <div class="card-meta">
                    ${estado}
                    <span><i class="fa-solid fa-eye"></i> ${vistas}</span>
                    <span><i class="fa-solid fa-calendar"></i> ${fecha}</span>
                </div>
            </div>
        `;

        // Navegar a la página de detalle de la historia
        card.addEventListener("click", () => {
            window.location.href = `Mostrar_historia.html?id=${h.id}`;
        });

        lista.appendChild(card);
    });

    document.getElementById("badgeHistorias").textContent = historias.length;
}

// ─────────────────────────────────────────────
// RENDERIZAR USUARIOS
// ─────────────────────────────────────────────

function renderizarUsuarios(usuarios) {
    const lista = document.getElementById("listaUsuarios");
    lista.innerHTML = "";

    if (usuarios.length === 0) return;

    usuarios.forEach(u => {
        const foto = (u.foto_perfil && u.foto_perfil.trim() !== "")
            ? u.foto_perfil
            : "https://via.placeholder.com/50x50?text=?";

        const card = document.createElement("div");
        card.className = "card-usuario";
        card.innerHTML = `
            <img
                src="${foto}"
                alt="Foto de ${u.nombre}"
                onerror="this.src='https://via.placeholder.com/50x50?text=?'">
            <div class="usuario-info">
                <h3>${u.nombre}</h3>
                <p class="usuario-handle">@${u.usuario}</p>
                ${u.biografia
                    ? `<p class="usuario-bio">${u.biografia}</p>`
                    : ""}
            </div>
        `;

        card.addEventListener("click", () => {
            window.location.href = `User_dise.html?id=${u.id}`;
        });

        lista.appendChild(card);
    });

    document.getElementById("badgeUsuarios").textContent = usuarios.length;
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────

function cambiarTab(boton) {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("activo"));
    boton.classList.add("activo");

    tabActual = boton.dataset.tab;

    document.getElementById("listaHistorias").style.display =
        tabActual === "historias" ? "block" : "none";
    document.getElementById("listaUsuarios").style.display  =
        tabActual === "usuarios"  ? "block" : "none";
}

// ─────────────────────────────────────────────
// HELPERS DE UI
// ─────────────────────────────────────────────

function limpiarResultados() {
    document.getElementById("listaHistorias").innerHTML = "";
    document.getElementById("listaUsuarios").innerHTML  = "";
    mostrarSinResultados(false);
}

function mostrarCargando(estado) {
    document.getElementById("cargando").style.display = estado ? "flex" : "none";
}

function mostrarSinResultados(estado) {
    document.getElementById("sinResultados").style.display = estado ? "flex" : "none";
}

function actualizarBadges() {
    document.getElementById("badgeHistorias").textContent =
        todosLosResultados.historias.length;
    document.getElementById("badgeUsuarios").textContent  =
        todosLosResultados.usuarios.length;
}