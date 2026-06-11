// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const API = "http://localhost:3000";

// ═══════════════════════════════════════════════════════════════
// VERIFICAR SESIÓN
// ═══════════════════════════════════════════════════════════════

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario || !usuario.id) {
    window.location.href = "Login_Proyecto.html";
}

// ═══════════════════════════════════════════════════════════════
// FOTOS TEMPORALES (solo se envían si el usuario las cambió)
// ═══════════════════════════════════════════════════════════════

let nuevaFotoPerfil  = null;
let nuevaFotoPortada = null;

// ═══════════════════════════════════════════════════════════════
// CARGAR PERFIL
// ═══════════════════════════════════════════════════════════════

async function cargarPerfil() {
    try {
        const respuesta = await fetch(`${API}/usuario/${usuario.id}`);

        if (!respuesta.ok) throw new Error("No se pudo cargar el perfil");

        const datos = await respuesta.json();

        // ── Nombre ──────────────────────────────────────────────
        const nombre = datos.nombre || "";
        document.getElementById("nombrePerfil").textContent = nombre;
        document.getElementById("inputNombre").value        = nombre;

        // ── Usuario ──────────────────────────────────────────────
        document.getElementById("userPerfil").textContent = "@" + datos.usuario;
        document.getElementById("inputUser").value        = datos.usuario;

        // ── Biografía ────────────────────────────────────────────
        const bio = datos.biografia || "";
        document.getElementById("bioPerfil").textContent    = bio || "Sin biografía";
        document.getElementById("inputBio").value           = bio;
        document.getElementById("contadorTexto").textContent = bio.length;

        // ── Género ───────────────────────────────────────────────
        const genero = datos.genero || "No especificado";
        document.getElementById("generoPerfil").textContent = "Género: " + genero;
        document.getElementById("inputGenero").value        = genero;

        // ── Fecha de registro ────────────────────────────────────
        if (datos.fecha_registro) {
            const fecha = new Date(datos.fecha_registro);
            document.getElementById("fechaRegistro").textContent =
                "Se unió " +
                fecha.toLocaleDateString("es-ES", {
                    day:   "numeric",
                    month: "long",
                    year:  "numeric"
                });
        }

        // ── Foto de perfil ───────────────────────────────────────
        const foto = datos.foto_perfil || "./imagenes/foto-default.png";
        document.querySelectorAll(".foto-global").forEach(img => img.src = foto);
        document.getElementById("fotoPerfil").src = foto;

        // ── Portada ──────────────────────────────────────────────
        const portada = datos.foto_portada || "./imagenes/Denji-Beam.jpeg";
        document.querySelector(".fondo").src               = portada;
        document.getElementById("imagenFondo").src         = portada;

        // ── Nombre dinámico (sidebar) ────────────────────────────
        const nombreMostrar = datos.nombre || datos.usuario;
        document.getElementById("tituloHistorias").textContent =
            `Historias de ${nombreMostrar}`;
        document.querySelectorAll(".nombre-dinamico")
            .forEach(el => el.textContent = nombreMostrar);

        // ── Resetear fotos temporales ────────────────────────────
        nuevaFotoPerfil  = null;
        nuevaFotoPortada = null;

    } catch (error) {
        console.error("Error al cargar perfil:", error);
        mostrarToast("No se pudo cargar el perfil. Verifica tu conexión.", "error");
    }
}

// ═══════════════════════════════════════════════════════════════
// NAVEGACIÓN ENTRE SECCIONES
// ═══════════════════════════════════════════════════════════════

function mostrarSeccion(id, elemento) {
    // Ocultar todas las secciones
    document.querySelectorAll(".contenido-seccion").forEach(sec => {
        sec.classList.remove("activa");
        sec.style.display = "none";
    });

    // Mostrar la elegida
    const seccion = document.getElementById(id);
    seccion.classList.add("activa");
    seccion.style.display = "block";

    // Quitar activo de todos los links y activar el actual
    document.querySelectorAll(".nav-links a").forEach(a => a.classList.remove("activo"));
    elemento.classList.add("activo");

    // Si se entra a conversaciones, recargar posts
    if (id === "conversaciones-section") {
        cargarPublicaciones();
    }
}

// ═══════════════════════════════════════════════════════════════
// ABRIR / CERRAR EDITOR
// ═══════════════════════════════════════════════════════════════

function abrirEditor() {
    document.querySelector(".portada").style.display = "none";
    document.querySelector("nav").style.display      = "none";
    document.querySelectorAll(".contenido-seccion").forEach(s => s.style.display = "none");

    const editor = document.getElementById("editar-section");
    editor.style.display = "block";
    editor.classList.add("activa");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function cerrarEditor() {
    const editor = document.getElementById("editar-section");
    editor.style.display = "none";
    editor.classList.remove("activa");

    document.querySelector(".portada").style.display = "block";
    document.querySelector("nav").style.display      = "flex";

    // Mostrar la sección que estaba activa (o info por defecto)
    const activa = document.querySelector(".contenido-seccion.activa");
    if (activa) {
        activa.style.display = "block";
    } else {
        const info = document.getElementById("info-section");
        info.style.display = "block";
        info.classList.add("activa");
    }

    // Descartar cambios visuales no guardados
    nuevaFotoPerfil  = null;
    nuevaFotoPortada = null;
    cargarPerfil();
}

// ═══════════════════════════════════════════════════════════════
// CAMBIAR FOTO DE PERFIL
// ═══════════════════════════════════════════════════════════════

document.getElementById("inputFoto").addEventListener("change", function () {
    const archivo = this.files[0];
    if (!archivo) return;

    if (archivo.size > 2 * 1024 * 1024) {
        mostrarToast("La imagen es demasiado grande. El máximo es 2 MB.", "error");
        this.value = "";
        return;
    }

    const lector = new FileReader();
    lector.onload = function (e) {
        const base64 = e.target.result;
        nuevaFotoPerfil = base64;

        document.getElementById("fotoPerfil").src = base64;
        document.querySelectorAll(".foto-global").forEach(img => img.src = base64);
    };
    lector.readAsDataURL(archivo);
});

// ═══════════════════════════════════════════════════════════════
// CAMBIAR FOTO DE PORTADA
// ═══════════════════════════════════════════════════════════════

document.getElementById("inputFondo").addEventListener("change", function () {
    const archivo = this.files[0];
    if (!archivo) return;

    if (archivo.size > 2 * 1024 * 1024) {
        mostrarToast("La imagen es demasiado grande. El máximo es 2 MB.", "error");
        this.value = "";
        return;
    }

    const lector = new FileReader();
    lector.onload = function (e) {
        const base64 = e.target.result;
        nuevaFotoPortada = base64;

        document.getElementById("imagenFondo").src   = base64;
        document.querySelector(".fondo").src          = base64;
    };
    lector.readAsDataURL(archivo);
});

// ═══════════════════════════════════════════════════════════════
// GUARDAR CAMBIOS DE PERFIL
// ═══════════════════════════════════════════════════════════════

async function guardarCambios() {
    const nuevoNombre = document.getElementById("inputNombre").value.trim();
    const nuevoUser   = document.getElementById("inputUser").value.trim();
    const nuevaBio    = document.getElementById("inputBio").value.trim();
    const nuevoGenero = document.getElementById("inputGenero").value;

    // Validaciones
    if (!nuevoNombre) {
        mostrarToast("El nombre no puede estar vacío.", "error");
        return;
    }
    if (!nuevoUser) {
        mostrarToast("El usuario no puede estar vacío.", "error");
        return;
    }
    if (nuevoUser.includes(" ")) {
        mostrarToast("El nombre de usuario no puede contener espacios.", "error");
        return;
    }

    // Construir cuerpo — solo enviar fotos si cambiaron
    const cuerpo = {
        nombre:    nuevoNombre,
        usuario:   nuevoUser,
        biografia: nuevaBio,
        genero:    nuevoGenero
    };

    if (nuevaFotoPerfil)  cuerpo.foto_perfil  = nuevaFotoPerfil;
    if (nuevaFotoPortada) cuerpo.foto_portada = nuevaFotoPortada;

    try {
        const respuesta = await fetch(`${API}/usuario/${usuario.id}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(cuerpo)
        });

        const data = await respuesta.json();

        if (data.success) {
            // Actualizar localStorage
            usuario.nombre  = nuevoNombre;
            usuario.usuario = nuevoUser;
            if (nuevaFotoPerfil) usuario.foto_perfil = nuevaFotoPerfil;

            localStorage.setItem("usuario", JSON.stringify(usuario));

            nuevaFotoPerfil  = null;
            nuevaFotoPortada = null;

            await cargarPerfil();
            cargarPublicaciones();
            cerrarEditor();
            mostrarToast("Perfil actualizado correctamente.", "exito");

        } else {
            mostrarToast(data.error || "No se pudo actualizar el perfil.", "error");
        }

    } catch (error) {
        console.error("Error al guardar cambios:", error);
        mostrarToast("Ocurrió un error al actualizar el perfil.", "error");
    }
}

// ═══════════════════════════════════════════════════════════════
// CONTADOR DE BIOGRAFÍA
// ═══════════════════════════════════════════════════════════════

document.getElementById("inputBio").addEventListener("input", function () {
    document.getElementById("contadorTexto").textContent = this.value.length;
});

// ═══════════════════════════════════════════════════════════════
// CARGAR PUBLICACIONES
// ═══════════════════════════════════════════════════════════════

async function cargarPublicaciones() {
    try {
        const respuesta = await fetch(`${API}/publicaciones`);

        if (!respuesta.ok) throw new Error("No se pudieron cargar las publicaciones");

        const posts = await respuesta.json();

        mostrarPosts(posts);
        actualizarUltimoMensaje(posts);

    } catch (error) {
        console.error("Error al cargar publicaciones:", error);
    }
}

// ═══════════════════════════════════════════════════════════════
// MOSTRAR POSTS
// ═══════════════════════════════════════════════════════════════

function mostrarPosts(posts) {
    const contenedor = document.getElementById("contenedorPosts");
    contenedor.innerHTML = "";

    if (posts.length === 0) {
        contenedor.innerHTML = `
            <div class="card sin-posts">
                <i class="fa-solid fa-comments"></i>
                <p>Aún no hay publicaciones. ¡Sé el primero!</p>
            </div>`;
        return;
    }

    posts.forEach(post => {
        // ── Respuestas ──────────────────────────────────────────
        let respuestasHTML = "";
        (post.respuestas || []).forEach(resp => {
            respuestasHTML += `
                <div class="respuesta">
                    <img src="${resp.foto_perfil || './imagenes/foto-default.png'}"
                        class="foto-respuesta" alt="Foto">
                    <div>
                        <strong>${escapeHTML(resp.nombre)}</strong>
                        <p>${escapeHTML(resp.texto)}</p>
                    </div>
                </div>`;
        });

        // ── Fecha legible ────────────────────────────────────────
        const fecha = post.fecha
            ? new Date(post.fecha).toLocaleDateString("es-ES", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit"
            })
            : "Ahora mismo";

        const esMio = post.usuario_id === usuario.id;

        const div = document.createElement("div");
        div.classList.add("mensaje-post");
        div.dataset.postId = post.id;

        div.innerHTML = `
            <div class="mensaje-header">
                <div class="usuario-post">
                    <img src="${post.foto_perfil || './imagenes/foto-default.png'}"
                        class="foto-global" alt="Foto">
                    <div>
                        <h4>${escapeHTML(post.nombre)}</h4>
                        <span>${fecha}</span>
                    </div>
                </div>
                ${esMio ? `<button class="btn-eliminar-icon" title="Eliminar publicación">
                    <i class="fa-solid fa-trash"></i>
                </button>` : ""}
            </div>

            <p class="texto-post">${escapeHTML(post.texto)}</p>

            <div class="respuesta-box">
                <img src="${usuario.foto_perfil || './imagenes/foto-default.png'}"
                    class="foto-global" alt="Foto">
                <input type="text" placeholder="Escribe una respuesta..."
                    class="inputRespuesta">
                <button class="responderBtn">Responder</button>
            </div>

            <div class="respuestas">${respuestasHTML}</div>
        `;

        // Eliminar
        const btnEliminar = div.querySelector(".btn-eliminar-icon");
        if (btnEliminar) {
            btnEliminar.addEventListener("click", () => eliminarPost(post.id));
        }

        // Responder
        div.querySelector(".responderBtn").addEventListener("click", () => {
            const input  = div.querySelector(".inputRespuesta");
            const texto  = input.value.trim();
            if (!texto) return;

            fetch(`${API}/respuesta`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    publicacion_id: post.id,
                    usuario_id:     usuario.id,
                    texto
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    input.value = "";
                    cargarPublicaciones();
                } else {
                    mostrarToast("No se pudo publicar la respuesta.", "error");
                }
            })
            .catch(() => mostrarToast("Error de red al responder.", "error"));
        });

        contenedor.appendChild(div);
    });
}

// ═══════════════════════════════════════════════════════════════
// ELIMINAR POST
// ═══════════════════════════════════════════════════════════════

function eliminarPost(postId) {
    if (!confirm("¿Seguro que quieres eliminar esta publicación?")) return;

    fetch(`${API}/publicaciones/${postId}`, { method: "DELETE" })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                cargarPublicaciones();
                mostrarToast("Publicación eliminada.", "exito");
            } else {
                mostrarToast("No se pudo eliminar la publicación.", "error");
            }
        })
        .catch(() => mostrarToast("Error de red al eliminar.", "error"));
}

// ═══════════════════════════════════════════════════════════════
// ÚLTIMO MENSAJE EN SIDEBAR
// ═══════════════════════════════════════════════════════════════

function actualizarUltimoMensaje(posts) {
    const elem  = document.getElementById("textoUltimoMensaje");
    const ultimo = posts.find(p => p.usuario_id === usuario.id);

    elem.textContent = ultimo
        ? ultimo.texto
        : "Aún no hay mensajes publicados";
}

// ═══════════════════════════════════════════════════════════════
// CARGAR HISTORIAS DEL USUARIO
// ═══════════════════════════════════════════════════════════════

async function cargarHistorias() {
    try {
        const respuesta = await fetch(`${API}/historias/${usuario.id}`);

        if (!respuesta.ok) throw new Error("Error al obtener historias");

        const historias = await respuesta.json();

        const contenedor         = document.getElementById("contenedorHistorias");
        const sinHistorias       = document.getElementById("sinHistorias");
        const contadorObras      = document.getElementById("contadorObras");
        const contadorPublicadas = document.getElementById("contadorPublicadas");
        const editorObras        = document.getElementById("editorObras");

        const total = historias.length;

        contadorObras.textContent      = total;
        contadorPublicadas.textContent = total;
        if (editorObras) editorObras.textContent = total;

        contenedor.innerHTML = "";

        if (total === 0) {
            sinHistorias.style.display = "block";
            return;
        }

        sinHistorias.style.display = "none";

        historias.forEach(historia => {
            const card = document.createElement("div");
            card.classList.add("card-historia");

            card.addEventListener("click", () => {
                window.location.href = `Mostrar_historia.html?id=${historia.id}`;
            });

            // Etiquetas (máx 4)
            let etiquetasHTML = "";
            if (historia.etiquetas) {
                historia.etiquetas.trim().split(/\s+/).slice(0, 4).forEach(tag => {
                    etiquetasHTML += `<span>${escapeHTML(tag)}</span>`;
                });
            }

            card.innerHTML = `
                <img src="${historia.portada || './imagenes/foto-default.png'}"
                    class="historia-portada" alt="Portada historia">
                <div class="historia-info">
                    <h2>${escapeHTML(historia.titulo)}</h2>
                    <div class="historia-stats">
                        <span><i class="fa-solid fa-eye"></i> 0</span>
                        <span><i class="fa-solid fa-star"></i> 0</span>
                        <span><i class="fa-solid fa-list"></i> 1</span>
                    </div>
                    <p class="historia-descripcion">${escapeHTML(historia.descripcion || "")}</p>
                    <div class="tags">${etiquetasHTML}</div>
                </div>
            `;

            contenedor.appendChild(card);
        });

    } catch (error) {
        console.error("Error al cargar historias:", error);
        document.getElementById("sinHistorias").style.display = "block";
    }
}

// ═══════════════════════════════════════════════════════════════
// UTILIDAD: ESCAPE HTML (evita XSS)
// ═══════════════════════════════════════════════════════════════

function escapeHTML(texto) {
    if (!texto) return "";
    return String(texto)
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;")
        .replace(/'/g,  "&#39;");
}

// ═══════════════════════════════════════════════════════════════
// UTILIDAD: TOAST DE NOTIFICACIONES
// ═══════════════════════════════════════════════════════════════

function mostrarToast(mensaje, tipo = "exito") {
    // Eliminar toast anterior si existe
    const anterior = document.getElementById("toast-global");
    if (anterior) anterior.remove();

    const toast = document.createElement("div");
    toast.id = "toast-global";
    toast.textContent = mensaje;
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${tipo === "exito" ? "#4caf50" : "#e53935"};
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        box-shadow: 0 4px 16px rgba(0,0,0,.3);
        z-index: 9999;
        animation: fadeInUp .3s ease;
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {

    // Ocultar secciones no activas al iniciar
    document.querySelectorAll(".contenido-seccion").forEach(sec => {
        if (!sec.classList.contains("activa")) {
            sec.style.display = "none";
        }
    });

    // Cargar datos
    await cargarPerfil();
    cargarPublicaciones();
    await cargarHistorias();

    // ── Botón Publicar ──────────────────────────────────────────
    document.getElementById("publicarBtn").addEventListener("click", async () => {
        const input = document.getElementById("inputPublicacion");
        const texto = input.value.trim();

        if (!texto) {
            mostrarToast("Escribe algo antes de publicar.", "error");
            return;
        }

        try {
            const respuesta = await fetch(`${API}/publicaciones`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ usuario_id: usuario.id, texto })
            });

            const data = await respuesta.json();

            if (data.success) {
                input.value = "";
                cargarPublicaciones();
                mostrarToast("Publicación creada.", "exito");
            } else {
                mostrarToast(data.error || "No se pudo publicar.", "error");
            }

        } catch (error) {
            console.error("Error al publicar:", error);
            mostrarToast("Error de red al publicar.", "error");
        }
    });
});