const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo     = document.getElementById("correo").value.trim();
    const contraseña = document.getElementById("contraseña").value;

    if (!correo || !contraseña) {
        alert("Completa todos los campos");
        return;
    }

    const btnEntrar = document.getElementById("btnEntrar");
    btnEntrar.disabled    = true;
    btnEntrar.textContent = "Entrando...";

    try {
        const respuesta = await fetch("/login", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ correo, contraseña })
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            // ── CLAVE UNIFICADA: "usuario" ─────────────────────────
            // Proyecto.js, Mostrar_historia.js y el resto de la app
            // leen siempre localStorage.getItem("usuario")
            const sesion = {
                id:          resultado.usuario.id,
                nombre:      resultado.usuario.nombre,
                usuario:     resultado.usuario.usuario,
                correo:      resultado.usuario.correo,
                foto_perfil: resultado.usuario.foto_perfil
            };

            localStorage.setItem("usuario", JSON.stringify(sesion));

            window.location.href = "Proyecto.html";

        } else {
            alert("Correo o contraseña incorrectos.");
            btnEntrar.disabled    = false;
            btnEntrar.textContent = "Entrar";
        }

    } catch (error) {
        console.error("Error en login:", error);
        alert("No se pudo conectar con el servidor. Intenta de nuevo.");
        btnEntrar.disabled    = false;
        btnEntrar.textContent = "Entrar";
    }
});