const btnEntrar = document.getElementById("btnEntrar");

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const correo = document.getElementById("correo").value.trim();
    const contraseña = document.getElementById("contraseña").value;

    if (correo === "" || contraseña === "") {

        alert("Completa todos los campos");
        return;

    }

    try {

        const respuesta = await fetch("/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                correo,
                contraseña

            })

        });

        const resultado = await respuesta.json();

        if (resultado.success) {

            alert("Bienvenido " + resultado.usuario.usuario);

            // Guardar la sesión
            localStorage.setItem(
                "usuario",
                JSON.stringify({
                    id: resultado.usuario.id,
                    nombre:resultado.usuario.nombre,
                    usuario: resultado.usuario.usuario,
                    correo: resultado.usuario.correo,
                    foto_perfil: resultado.usuario.foto_perfil
                })
            );

            // Ir a la página principal
            window.location.href = "Proyecto.html";

        } else {

            alert("Correo o contraseña incorrectos");

        }

    } catch (error) {

        console.error(error);

        alert("Error al conectar con el servidor");

    }

});