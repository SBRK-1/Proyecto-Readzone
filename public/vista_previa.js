// ─────────────────────────────────────────────
// VISTA PREVIA
// Los datos vienen de Escritura.js a través de
// localStorage justo antes de abrir esta pestaña.
// No necesita conectarse al servidor.
// ─────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {

    let datos = null;

    try {
        datos = JSON.parse(localStorage.getItem("previewREADZONE"));
    } catch (err) {
        console.error("Error al leer vista previa:", err);
    }

    if (!datos) {
        document.querySelector(".lectura").innerHTML = `
            <p style="color:red; padding:40px; text-align:center;">
                No hay datos de vista previa.<br>
                <button onclick="window.close()" style="margin-top:16px;">
                    Cerrar
                </button>
            </p>
        `;
        return;
    }

    // Título del capítulo
    document.getElementById("tituloCapitulo").textContent =
        datos.titulo || "Sin título";

    // Contenido del capítulo (HTML del editor)
    document.getElementById("contenidoCapitulo").innerHTML =
        datos.contenido || "<p>Sin contenido.</p>";

    // Portada de la historia
    const portadaEl = document.getElementById("portadaHistoria");
    if (datos.portada) {
        portadaEl.src = datos.portada;
    } else {
        portadaEl.style.display = "none";
    }

    // Nombre de la historia en el sidebar
    document.getElementById("nombreHistoria").textContent =
        datos.nombreHistoria || "Historia sin título";

    // Título de la pestaña del navegador
    document.title = (datos.nombreHistoria || "Vista previa") + " - READZONE";
});