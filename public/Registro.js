document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.querySelector('#togglePassword');
    const passwordInput  = document.querySelector('#password');
    const registrationForm = document.querySelector('#registrationForm');

    // ─── Mostrar / ocultar contraseña ───
    togglePassword.addEventListener('click', () => {
        const tipo = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', tipo);
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });

    // ─── Enviar formulario ───
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = document.querySelector('#firstName').value.trim();
        const lastName  = document.querySelector('#lastName').value.trim();
        const userName  = document.querySelector('#userName').value.trim();
        const email     = document.querySelector('#email').value.trim();
        const password  = passwordInput.value;

        const nombre = (firstName + " " + lastName).trim();

        // ─── Validaciones ───
        if (!nombre) {
            alert("Por favor ingresa tu nombre completo.");
            return;
        }
        if (!userName) {
            alert("Por favor ingresa un nombre de usuario.");
            return;
        }
        if (!email) {
            alert("Por favor ingresa tu correo electrónico.");
            return;
        }
        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        // ─── Deshabilitar botón para evitar doble envío ───
        const btnSubmit = registrationForm.querySelector('.register-btn');
        btnSubmit.disabled    = true;
        btnSubmit.textContent = "Registrando...";

        try {
            // Usar ruta relativa (sin localhost) para que funcione en producción
            const respuesta = await fetch("/registro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre,
                    usuario:    userName,
                    correo:     email,
                    contraseña: password
                })
            });

            const resultado = await respuesta.json();

            if (resultado.success) {
                // ─── Guardar sesión en sessionStorage Y localStorage ───
                // sessionStorage: sesión activa en esta pestaña
                // localStorage: para recordar al usuario si cierra y vuelve
                sessionStorage.setItem("usuarioREADZONE", JSON.stringify(resultado.usuario));
                localStorage.setItem("usuarioREADZONE",   JSON.stringify(resultado.usuario));

                // Redirigir a la página principal del proyecto
                window.location.href = "Proyecto.html";

            } else {
                // El servidor devolvió success: false (usuario/correo duplicado, etc.)
                alert("Error al registrar: " + (resultado.error || "Intenta con otro correo o usuario."));
                btnSubmit.disabled    = false;
                btnSubmit.textContent = "REGISTRARSE";
            }

        } catch (error) {
            console.error("Error en fetch:", error);
            alert("No se pudo conectar con el servidor. Verifica tu conexión.");
            btnSubmit.disabled    = false;
            btnSubmit.textContent = "REGISTRARSE";
        }
    });
});