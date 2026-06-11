const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo    = document.getElementById("correo").value.trim();
    const contraseña = document.getElementById("contraseña").value;

    if (!correo || !contraseña) {
        alert("Completa todos los campos");
        return;
    }

    // Deshabilitar botón para evitar doble envío
    const btnEntrar = document.getElementById("btnEntrar");
    btnEntrar.disabled    = true;
    btnEntrar.textContent = "Entrando...";

    try {
        const respuesta = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contraseña })
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            // ─── Guardar sesión con la misma clave que usa toda la app ───
            // Tanto sessionStorage (pestaña activa) como localStorage (persistente)
            const sesion = {
                id:          resultado.usuario.id,
                nombre:      resultado.usuario.nombre,
                usuario:     resultado.usuario.usuario,
                correo:      resultado.usuario.correo,
                foto_perfil: resultado.usuario.foto_perfil
            };

            sessionStorage.setItem("usuarioREADZONE", JSON.stringify(sesion));
            localStorage.setItem("usuarioREADZONE",   JSON.stringify(sesion));

            // Redirigir al proyecto
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