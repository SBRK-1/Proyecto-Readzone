// ─────────────────────────────────────────────
// IDs guardados por Historias.js / Modificar_historias.js
// ─────────────────────────────────────────────

const historiaId  = localStorage.getItem("HistoriaEditando");
const capituloId  = localStorage.getItem("CapituloEditando");

// ─────────────────────────────────────────────
// ELEMENTOS
// ─────────────────────────────────────────────

const tituloInput           = document.getElementById("tituloCapitulo");
const editor                = document.getElementById("contenidoCapitulo");
const estadoEl              = document.getElementById("estadoGuardado");
const toastEl               = document.getElementById("toastGuardado");
const contadorPalabras      = document.getElementById("contadorPalabras");
const contadorCaracteres    = document.getElementById("contadorCaracteres");
const nombreHistoriaEl      = document.getElementById("nombreHistoria");
const descripcionMiniEl     = document.getElementById("descripcionHistoriaMini");
const portadaEl             = document.getElementById("portadaHistoria");
const ultimaEdicionEl       = document.getElementById("ultimaEdicion");
const btnGuardar            = document.getElementById("btnGuardar");
const btnVistaPrevia        = document.getElementById("btnVistaPrevia");
const btnPublicar           = document.getElementById("btnPublicar");
const btnVolver             = document.getElementById("btnVolver");

// ─────────────────────────────────────────────
// ARRANQUE
// ─────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", async () => {

    if (!historiaId || !capituloId) {
        alert("No hay historia o capítulo seleccionado.");
        location.href = "Modificar_historias.html";
        return;
    }

    await cargarDatos();
});

// ─────────────────────────────────────────────
// CARGAR HISTORIA Y CAPÍTULO DESDE EL SERVIDOR
// ─────────────────────────────────────────────

async function cargarDatos() {
    try {
        const resHistoria = await fetch(`/historia/${historiaId}`);
        const historia    = await resHistoria.json();

        if (historia.error) {
            alert("Historia no encontrada.");
            location.href = "Modificar_historias.html";
            return;
        }

        nombreHistoriaEl.textContent  = historia.titulo      || "Nueva Historia";
        descripcionMiniEl.textContent = historia.descripcion || "";

        if (historia.portada) {
            portadaEl.src = historia.portada;
        }

        const resCapitulo = await fetch(`/capitulo/${capituloId}`);
        const capitulo    = await resCapitulo.json();

        if (capitulo.error) {
            alert("Capítulo no encontrado.");
            location.href = "Modificar_historias.html";
            return;
        }

        tituloInput.value  = capitulo.titulo   || "";
        editor.innerHTML   = capitulo.contenido || "";

        if (capitulo.fecha_creacion) {
            ultimaEdicionEl.textContent =
                "Última edición: " +
                new Date(capitulo.fecha_creacion).toLocaleString();
        }

        actualizarContador();

    } catch (err) {
        console.error("Error al cargar datos:", err);
        alert("No se pudo conectar con el servidor.");
    }
}

// ─────────────────────────────────────────────
// CONTADORES
// ─────────────────────────────────────────────

editor.addEventListener("input", actualizarContador);

function actualizarContador() {
    const texto    = editor.innerText.trim();
    const palabras = texto ? texto.split(/\s+/) : [];

    contadorPalabras.textContent   = palabras.length + " palabras";
    contadorCaracteres.textContent = editor.innerText.length + " caracteres";
}

// ─────────────────────────────────────────────
// MARCAR SIN GUARDAR
// ─────────────────────────────────────────────

tituloInput.addEventListener("input", () => {
    nombreHistoriaEl.textContent = tituloInput.value || "Nueva Historia";
    marcarSinGuardar();
});

editor.addEventListener("input", marcarSinGuardar);

function marcarSinGuardar() {
    estadoEl.classList.remove("guardado");
    estadoEl.innerHTML = `<i class="fa-solid fa-cloud"></i> Sin guardar`;
}

// ─────────────────────────────────────────────
// INSERTAR IMAGEN
// ─────────────────────────────────────────────

document.getElementById("inputImagen").addEventListener("change", function () {

    const archivo = this.files[0];
    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = (e) => {
        editor.focus();
        document.execCommand("insertHTML", false, `
            <div class="bloque-media">
                <button class="btn-eliminar-media"
                        onclick="this.closest('.bloque-media').remove()">✖</button>
                <img src="${e.target.result}" class="imagen-capitulo">
            </div>
            <p><br></p>
        `);
        editor.focus();
        marcarSinGuardar();
    };

    lector.readAsDataURL(archivo);
    this.value = "";
});

// ─────────────────────────────────────────────
// INSERTAR VIDEO
// ─────────────────────────────────────────────

document.getElementById("inputVideo").addEventListener("change", function () {

    const archivo = this.files[0];
    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = (e) => {
        editor.focus();
        document.execCommand("insertHTML", false, `
            <div class="bloque-media">
                <button class="btn-eliminar-media"
                        onclick="this.closest('.bloque-media').remove()">✖</button>
                <video controls src="${e.target.result}"></video>
            </div>
            <p><br></p>
        `);
        editor.focus();
        marcarSinGuardar();
    };

    lector.readAsDataURL(archivo);
    this.value = "";
});

// ─────────────────────────────────────────────
// ELIMINAR MEDIA
// ─────────────────────────────────────────────

editor.addEventListener("click", (e) => {

    document.querySelectorAll(".bloque-media")
            .forEach(b => b.classList.remove("activo"));

    const bloque = e.target.closest(".bloque-media");
    if (bloque) bloque.classList.add("activo");

    if (e.target.classList.contains("btn-eliminar-media")) {
        e.target.closest(".bloque-media").remove();
        marcarSinGuardar();
    }
});

// ─────────────────────────────────────────────
// GUARDAR CAPÍTULO
// ─────────────────────────────────────────────

btnGuardar.addEventListener("click", guardarCapitulo);

async function guardarCapitulo() {

    estadoEl.innerHTML  = `<i class="fa-solid fa-circle-notch girando"></i> Guardando...`;
    btnGuardar.disabled = true;

    try {
        const res = await fetch(`/capitulo/${capituloId}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
                titulo:    tituloInput.value,
                contenido: editor.innerHTML
            })
        });

        const data = await res.json();

        if (!data.success) throw new Error(data.error || "Error desconocido");

        estadoEl.innerHTML = `<i class="fa-solid fa-check"></i> Guardado correctamente`;
        estadoEl.classList.add("guardado");
        ultimaEdicionEl.textContent = "Última edición: " + new Date().toLocaleString();
        mostrarToast();

    } catch (err) {
        console.error("Error al guardar:", err);
        estadoEl.innerHTML = `<i class="fa-solid fa-xmark"></i> Error al guardar`;
        alert("No se pudo guardar. Verifica tu conexión.");
    }

    btnGuardar.disabled = false;
}

// ─────────────────────────────────────────────
// AUTOGUARDADO CADA 30 SEGUNDOS
// ─────────────────────────────────────────────

setInterval(async () => {

    if (!historiaId || !capituloId) return;

    try {
        await fetch(`/capitulo/${capituloId}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
                titulo:    tituloInput.value,
                contenido: editor.innerHTML
            })
        });

        estadoEl.innerHTML = `<i class="fa-solid fa-check"></i> Guardado automáticamente`;
        estadoEl.classList.add("guardado");

    } catch (err) {
        console.error("Autoguardado fallido:", err);
    }

}, 30000);

// ─────────────────────────────────────────────
// VISTA PREVIA
// ─────────────────────────────────────────────

btnVistaPrevia.addEventListener("click", async () => {

    await guardarCapitulo();

    localStorage.setItem("previewREADZONE", JSON.stringify({
        titulo:         tituloInput.value,
        contenido:      editor.innerHTML,
        portada:        portadaEl.src,
        nombreHistoria: nombreHistoriaEl.textContent
    }));

    window.open("vista_previa.html", "_blank");
});

// ─────────────────────────────────────────────
// PUBLICAR
// ─────────────────────────────────────────────

btnPublicar.addEventListener("click", async () => {

    await guardarCapitulo();

    try {
        const res  = await fetch(`/historia/${historiaId}/publicar`, { method: "PUT" });
        const data = await res.json();

        if (data.success) {
            alert("¡Historia publicada correctamente!");
        } else {
            alert("Error al publicar: " + (data.error || "desconocido"));
        }

    } catch (err) {
        console.error("Error al publicar:", err);
        alert("No se pudo conectar con el servidor.");
    }
});

// ─────────────────────────────────────────────
// VOLVER → ahora va a Editar_contenido.html
// ─────────────────────────────────────────────

btnVolver.addEventListener("click", async () => {

    const confirmar = confirm("¿Volver a editar los detalles de la historia?");
    if (!confirmar) return;

    // Guardar automáticamente antes de salir
    await guardarCapitulo();

    location.href = "Editar_contenido.html";
});

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────

function mostrarToast() {
    toastEl.classList.add("activo");
    setTimeout(() => toastEl.classList.remove("activo"), 2500);
}