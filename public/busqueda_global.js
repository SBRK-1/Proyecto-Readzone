// busqueda_global.js

function buscarHistoria() {
    const texto = document.getElementById("buscador")
        .value
        .trim();

    if (texto === "") {
        alert("Escribe algo para buscar");
        return;
    }

    window.location.href =
        `Busqueda_historias.html?q=${encodeURIComponent(texto)}`;
}

document.addEventListener("DOMContentLoaded", () => {
    const buscador = document.getElementById("buscador");

    if (buscador) {
        buscador.addEventListener("keypress", (e) => {
            if (e.key === "Enter") buscarHistoria();
        });
    }
});