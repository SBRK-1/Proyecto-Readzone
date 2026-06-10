const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    window.location.href = "Login_Proyecto.html";
    return;
}

document.addEventListener("DOMContentLoaded", async () => {

    // FOTO DE PERFIL
    const fotoPerfil = document.getElementById("fotoPerfilPrincipal");

    if (fotoPerfil) {
        fotoPerfil.src = usuario.foto_perfil
            ? usuario.foto_perfil
            : "./imagenes/foto-default.png";
    }

    // CERRAR SESIÓN
    const btn = document.getElementById("cerrarSesion");

    if (btn) {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("usuario");
            window.location.href = "Presentacion.html";
        });
    }

    try {
        const respuesta = await fetch("http://localhost:3000/historias");

        if (!respuesta.ok) {
            throw new Error("Error al cargar historias");
        }

        const datos = await respuesta.json();
        const historiasPopulares = datos.populares || [];
        const historiasRecientes = datos.recientes || [];

        const populares = document.getElementById("populares");
        const recientes = document.getElementById("recientes");

        if (!populares || !recientes) return;

        populares.innerHTML = "";
        recientes.innerHTML = "";

        // Mostrar populares
        historiasPopulares.forEach((h) => {

            populares.innerHTML += `
                <div class="historia-card">
                    <img src="${h.portada || './imagenes/default.jpg'}" alt="">
                    <h4>${h.titulo}</h4>
                    <p>Lecturas: ${h.total_vistas}</p>
                </div>
            `;

        });

        // Mostrar recientes
        historiasRecientes.forEach((h) => {

            recientes.innerHTML += `
                <div class="historia-card">
                    <img src="${h.portada || './imagenes/default.jpg'}" alt="">
                    <h4>${h.titulo}</h4>
                    <p>Lecturas: ${h.total_vistas}</p>
                </div>
            `;

        });

    } catch (error) {
        console.error("Error cargando historias:", error);
    }
});