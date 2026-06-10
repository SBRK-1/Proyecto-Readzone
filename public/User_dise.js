// USUARIO LOGUEADO
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    window.location.href = "Login_Proyecto.html";
}

// Variables para guardar las fotos como base64 (solo cuando el usuario las cambia)
let nuevaFotoPerfil = null;
let nuevaFotoPortada = null;

// CARGAR PERFIL DESDE LA BASE DE DATOS
async function cargarPerfil() {

    try {

        const respuesta = await fetch(
            `http://localhost:3000/usuario/${usuario.id}`
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el perfil");
        }

        const datos = await respuesta.json();

        // NOMBRE
        document.getElementById("nombrePerfil").textContent =
            datos.nombre || "";

        document.getElementById("inputNombre").value =
            datos.nombre || "";

        // USUARIO
        document.getElementById("userPerfil").textContent =
            "@" + datos.usuario;

        document.getElementById("inputUser").value =
            datos.usuario;

        // BIO
        document.getElementById("bioPerfil").textContent =
            datos.biografia || "Sin biografía";

        document.getElementById("inputBio").value =
            datos.biografia || "";

        document.getElementById("contadorTexto").textContent =
            (datos.biografia || "").length;

        // GÉNERO
        document.getElementById("generoPerfil").textContent =
            "Género: " + (datos.genero || "No especificado");

        document.getElementById("inputGenero").value =
            datos.genero || "Selecciona una opción";

        // FECHA DE REGISTRO
        const fecha = new Date(datos.fecha_registro);

        document.getElementById("fechaRegistro").textContent =
            "Se ha unido " +
            fecha.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

        // FOTO DE PERFIL
        const foto = datos.foto_perfil || "./imagenes/foto-default.png";

        document.querySelectorAll(".foto-global")
            .forEach(img => img.src = foto);

        document.getElementById("fotoPerfil").src = foto;

        // Resetear fotos temporales al recargar perfil
        nuevaFotoPerfil = null;
        nuevaFotoPortada = null;

        // PORTADA
        const portada = datos.foto_portada || "./imagenes/Denji-Beam.jpeg";

        document.querySelector(".fondo").src = portada;
        document.getElementById("imagenFondo").src = portada;

        // TÍTULO DE HISTORIAS
        document.getElementById("tituloHistorias").textContent =
            `Historias de ${datos.nombre || datos.usuario}`;

        // ACTUALIZAR NOMBRES DINÁMICOS
        document.querySelectorAll(".nombre-dinamico")
            .forEach(el => el.textContent = datos.nombre || datos.usuario);

    } catch (error) {

        console.error("Error al cargar perfil:", error);

    }

}

function mostrarSeccion(id, elemento) {

    // OCULTAR TODAS LAS SECCIONES
    const secciones = document.querySelectorAll(".contenido-seccion");

    secciones.forEach(sec => {
        sec.classList.remove("activa");
        sec.style.display = "none";
    });

    // MOSTRAR LA SECCIÓN SELECCIONADA
    const seccionActiva = document.getElementById(id);
    seccionActiva.classList.add("activa");
    seccionActiva.style.display = "block";

    // QUITAR ACTIVO A TODOS LOS LINKS
    const links = document.querySelectorAll(".nav-links a");
    links.forEach(link => link.classList.remove("activo"));

    // ACTIVAR LINK ACTUAL
    elemento.classList.add("activo");
}


/* ABRIR EDITOR */
function abrirEditor() {

    // OCULTAR PORTADA Y NAV
    document.querySelector(".portada").style.display = "none";
    document.querySelector("nav").style.display = "none";

    // OCULTAR SECCIONES DE CONTENIDO
    document.querySelectorAll(".contenido-seccion").forEach(sec => {
        sec.style.display = "none";
    });

    // MOSTRAR EDITOR
    const editor = document.getElementById("editar-section");
    editor.style.display = "block";
    editor.classList.add("activa");

    // SCROLL ARRIBA
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* CERRAR EDITOR */
function cerrarEditor() {

    // OCULTAR EDITOR
    const editor = document.getElementById("editar-section");
    editor.style.display = "none";
    editor.classList.remove("activa");

    // MOSTRAR PORTADA Y NAV
    document.querySelector(".portada").style.display = "block";
    document.querySelector("nav").style.display = "flex";

    // MOSTRAR SECCIÓN ACTIVA
    const activa = document.querySelector(".contenido-seccion.activa");
    if (activa) {
        activa.style.display = "block";
    } else {
        // Si no hay ninguna activa, mostrar info por defecto
        document.getElementById("info-section").style.display = "block";
        document.getElementById("info-section").classList.add("activa");
    }

    // Resetear fotos temporales si se cancela
    nuevaFotoPerfil = null;
    nuevaFotoPortada = null;

    // Recargar perfil para descartar cambios visuales no guardados
    cargarPerfil();
}

/* CAMBIAR FOTO PERFIL */
document.getElementById("inputFoto").addEventListener("change", function () {

    const archivo = this.files[0];

    if (!archivo) return;

    // Validar tamaño máximo: 2MB
    if (archivo.size > 2 * 1024 * 1024) {
        alert("La imagen es demasiado grande. El máximo es 2MB.");
        return;
    }

    const lector = new FileReader();

    lector.onload = function (e) {
        const imagen = e.target.result;

        // Guardar base64 para enviar al servidor
        nuevaFotoPerfil = imagen;

        // Actualizar previews
        document.getElementById("fotoPerfil").src = imagen;
        document.querySelectorAll(".foto-global").forEach(foto => {
            foto.src = imagen;
        });
    };

    lector.readAsDataURL(archivo);
});

/* CAMBIAR FONDO */
document.getElementById("inputFondo").addEventListener("change", function () {

    const archivo = this.files[0];

    if (!archivo) return;

    // Validar tamaño máximo: 2MB
    if (archivo.size > 2 * 1024 * 1024) {
        alert("La imagen es demasiado grande. El máximo es 2MB.");
        return;
    }

    const lector = new FileReader();

    lector.onload = function (e) {
        const imagen = e.target.result;

        // Guardar base64 para enviar al servidor
        nuevaFotoPortada = imagen;

        // Actualizar previews
        document.getElementById("imagenFondo").src = imagen;
        document.querySelector(".fondo").src = imagen;
    };

    lector.readAsDataURL(archivo);
});

// CARGAR PUBLICACIONES DESDE MYSQL
async function cargarPublicaciones() {

    try {

        const respuesta = await fetch("http://localhost:3000/publicaciones");

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar las publicaciones");
        }

        const posts = await respuesta.json();

        mostrarPosts(posts);
        actualizarUltimoMensaje(posts);

    } catch (error) {

        console.error("Error al cargar publicaciones:", error);

    }

}

/* MOSTRAR POSTS */
function mostrarPosts(posts) {

    const contenedorPosts = document.getElementById("contenedorPosts");
    contenedorPosts.innerHTML = "";

    posts.forEach(post => {

        let respuestasHTML = "";

        (post.respuestas || []).forEach(resp => {
            respuestasHTML += `
                <div class="respuesta">
                    <img
                        src="${resp.foto_perfil || "./imagenes/foto-default.png"}"
                        class="foto-respuesta">
                    <div>
                        <strong>${resp.nombre}</strong>
                        <p>${resp.texto}</p>
                    </div>
                </div>
            `;
        });

        const div = document.createElement("div");
        div.classList.add("mensaje-post");

        const puedeEliminar = post.usuario_id === usuario.id;

        div.innerHTML = `
            <div class="mensaje-header">
                <div class="usuario-post">
                    <img src="${post.foto_perfil || "./imagenes/foto-default.png"}" class="foto-global">
                    <div>
                        <h4>${post.nombre}</h4>
                        <span>Ahora mismo</span>
                    </div>
                </div>
                ${puedeEliminar
                    ? `<i class="fa-solid fa-trash eliminar-post-icon"></i>`
                    : ""
                }
            </div>

            <p class="texto-post">${post.texto}</p>

            <div class="respuesta-box">
                <img src="${post.foto_perfil || "./imagenes/foto-default.png"}" class="foto-global">
                <input
                    type="text"
                    placeholder="Escribe una respuesta..."
                    class="inputRespuesta">
                <button class="responderBtn">Responder</button>
            </div>

            <div class="respuestas">
                ${respuestasHTML}
            </div>

            ${puedeEliminar
                ? `<button class="eliminar-post">Eliminar publicación</button>`
                : ""
            }
        `;

        /* ELIMINAR CON BOTÓN */
        const btnEliminar = div.querySelector(".eliminar-post");
        if (btnEliminar) {
            btnEliminar.addEventListener("click", () => eliminarPost(post.id));
        }

        /* ELIMINAR CON ICONO */
        const iconoEliminar = div.querySelector(".eliminar-post-icon");
        if (iconoEliminar) {
            iconoEliminar.addEventListener("click", () => eliminarPost(post.id));
        }

        /* RESPONDER */
        div.querySelector(".responderBtn").addEventListener("click", () => {

            const input = div.querySelector(".inputRespuesta");
            const textoRespuesta = input.value.trim();

            if (textoRespuesta === "") return;

            fetch("http://localhost:3000/respuesta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    publicacion_id: post.id,
                    usuario_id: usuario.id,
                    texto: textoRespuesta
                })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        input.value = "";
                        cargarPublicaciones();
                    }
                });

        });

        contenedorPosts.appendChild(div);
    });
}

/* ELIMINAR POST — función separada para no duplicar código */
function eliminarPost(postId) {
    fetch(`http://localhost:3000/publicaciones/${postId}`, {
        method: "DELETE"
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                cargarPublicaciones();
            }
        });
}

/* ÚLTIMO MENSAJE */
function actualizarUltimoMensaje(posts) {

    const textoUltimoMensaje = document.getElementById("textoUltimoMensaje");

    const ultimo = posts.find(p => p.usuario_id === usuario.id);

    if (!ultimo) {
        textoUltimoMensaje.textContent = "Aún no hay mensajes publicados";
        return;
    }

    textoUltimoMensaje.textContent = ultimo.texto;
}

/* GUARDAR CAMBIOS — CORREGIDO */
function guardarCambios() {

    const nuevoNombre  = document.getElementById("inputNombre").value.trim();
    const nuevoUser    = document.getElementById("inputUser").value.trim();
    const nuevaBio     = document.getElementById("inputBio").value.trim();
    const nuevoGenero  = document.getElementById("inputGenero").value;

    // Validaciones básicas
    if (!nuevoNombre) {
        alert("El nombre no puede estar vacío.");
        return;
    }

    if (!nuevoUser) {
        alert("El usuario no puede estar vacío.");
        return;
    }

    // Construir el cuerpo de la petición
    // Solo enviar las fotos si el usuario las cambió en esta sesión
    const cuerpo = {
        nombre:   nuevoNombre,
        usuario:  nuevoUser,
        biografia: nuevaBio,
        genero:   nuevoGenero
    };

    if (nuevaFotoPerfil) {
        cuerpo.foto_perfil = nuevaFotoPerfil;
    }

    if (nuevaFotoPortada) {
        cuerpo.foto_portada = nuevaFotoPortada;
    }

    fetch(`http://localhost:3000/usuario/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo)
    })
        .then(r => r.json())
        .then(data => {

            if (data.success) {

                // Actualizar localStorage
                usuario.nombre   = nuevoNombre;
                usuario.usuario  = nuevoUser;

                if (nuevaFotoPerfil) {
                    usuario.foto_perfil = nuevaFotoPerfil;
                }

                localStorage.setItem("usuario", JSON.stringify(usuario));

                // Resetear fotos temporales
                nuevaFotoPerfil  = null;
                nuevaFotoPortada = null;

                cargarPerfil();
                cargarPublicaciones();
                cerrarEditor();

                alert("Perfil actualizado correctamente.");

            } else {

                alert(data.error || "No se pudo actualizar el perfil.");

            }

        })
        .catch(error => {
            console.error("Error al guardar cambios:", error);
            alert("Ocurrió un error al actualizar el perfil.");
        });
}

// CONTADOR DE BIOGRAFÍA
document.getElementById("inputBio").addEventListener("input", function () {
    document.getElementById("contadorTexto").textContent = this.value.length;
});

/* DOMContentLoaded — inicializa todo */
document.addEventListener("DOMContentLoaded", async () => {

    // CARGAR PERFIL Y PUBLICACIONES
    await cargarPerfil();
    cargarPublicaciones();

    // OCULTAR SECCIONES NO ACTIVAS
    document.querySelectorAll(".contenido-seccion").forEach(sec => {
        if (!sec.classList.contains("activa")) {
            sec.style.display = "none";
        }
    });

    // BOTÓN PUBLICAR
    document.getElementById("publicarBtn").addEventListener("click", () => {

        const inputPublicacion = document.getElementById("inputPublicacion");
        const texto = inputPublicacion.value.trim();

        if (texto === "") {
            alert("Escribe algo antes de publicar.");
            return;
        }

        fetch("http://localhost:3000/publicaciones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario_id: usuario.id,
                texto: texto
            })
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    inputPublicacion.value = "";
                    cargarPublicaciones();
                }
            });

    });

    // CARGAR HISTORIAS
    try {

        const respuesta = await fetch(
            `http://localhost:3000/historias/${usuario.id}`
        );

        if (!respuesta.ok) {
            throw new Error("Error al obtener historias");
        }

        const historias = await respuesta.json();

        const contenedor       = document.getElementById("contenedorHistorias");
        const sinHistorias     = document.getElementById("sinHistorias");
        const contadorObras    = document.getElementById("contadorObras");
        const contadorPublicadas = document.getElementById("contadorPublicadas");

        contadorObras.textContent    = historias.length;
        contadorPublicadas.textContent = historias.length;

        if (historias.length === 0) {
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

            let etiquetasHTML = "";

            if (historia.etiquetas) {
                historia.etiquetas.split(" ").slice(0, 4).forEach(tag => {
                    etiquetasHTML += `<span>${tag}</span>`;
                });
            }

            card.innerHTML = `
                <img
                    src="${historia.portada || "./imagenes/Asa-mitaka.jpg"}"
                    class="historia-portada">

                <div class="historia-info">
                    <h2>${historia.titulo}</h2>

                    <div class="historia-stats">
                        <span><i class="fa-solid fa-eye"></i> 0</span>
                        <span><i class="fa-solid fa-star"></i> 0</span>
                        <span><i class="fa-solid fa-list"></i> 1</span>
                    </div>

                    <p class="historia-descripcion">${historia.descripcion}</p>

                    <div class="tags">${etiquetasHTML}</div>
                </div>
            `;

            contenedor.appendChild(card);
        });

    } catch (error) {
        console.error("Error al cargar historias:", error);
    }

});