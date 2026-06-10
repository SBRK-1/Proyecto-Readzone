document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.querySelector('#togglePassword');
    const passwordInput = document.querySelector('#password');
    const registrationForm = document.querySelector('#registrationForm');

    // Mostrar / ocultar contraseña
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });

    // Enviar formulario
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = document.querySelector('#firstName').value.trim();
        const lastName = document.querySelector('#lastName').value.trim();
        const userName = document.querySelector('#userName').value.trim();
        const email = document.querySelector('#email').value.trim();
        const password = passwordInput.value;

        const nombre = firstName + " " + lastName;

        // VALIDACIÓN BÁSICA
        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        try {
            const respuesta = await fetch("http://localhost:3000/registro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombre,
                    usuario: userName,
                    correo: email,
                    contraseña: password
                })
            });

            const resultado = await respuesta.json(); // ✔ SOLO UNA VEZ

            if (resultado.success) {
                alert("Usuario registrado correctamente");

                window.location.href = "Proyecto.html";

            } else {
                alert("Error: no se pudo registrar el usuario");
            }

        } catch (error) {
            console.error("Error en fetch:", error);
            alert("Error de conexión con el servidor");
        }
    });
});