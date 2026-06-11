// ─────────────────────────────────────────────
// BUSQUEDA_GLOBAL.JS
// Redirige al buscador desde cualquier página
// ─────────────────────────────────────────────

function buscarHistorias() {
    const input = document.getElementById("buscador");

    if (!input) return;

    const texto = input.value.trim();

    if (texto === "") {
        alert("Escribe algo para buscar");
        return;
    }

    window.location.href =
        `Busqueda_historias.html?q=${encodeURIComponent(texto)}`;
}

// Alias para compatibilidad (por si alguna página usa la versión sin 's')
function buscarHistoria() {
    buscarHistorias();
}

// CORREGIDO: solo agregar el listener de Enter cuando el elemento exista
document.addEventListener("DOMContentLoaded", () => {
    const buscador = document.getElementById("buscador");

    if (buscador) {
        buscador.addEventListener("keypress", (e) => {
            if (e.key === "Enter") buscarHistorias();
        });
    }
});