document.addEventListener("DOMContentLoaded", () => {

    // ─────────────────────────────────────────────
    // SESIÓN DE USUARIO
    // ─────────────────────────────────────────────

    const usuarioSesion = JSON.parse(
        sessionStorage.getItem("usuarioREADZONE") ||
        localStorage.getItem("usuarioREADZONE") ||
        "null"
    );

    if (!usuarioSesion) {
        alert("Debes iniciar sesión para crear una historia.");
        location.href = "Login.html";
        return;
    }

    // ─────────────────────────────────────────────
    // ELEMENTOS DEL DOM
    // ─────────────────────────────────────────────

    // Inputs de texto — se buscan por clase .grupo para ser más robustos
    const gruposInput    = document.querySelectorAll(".grupo input[type='text']");
    const tituloInput    = gruposInput[0];   // primer input de texto → título
    const etiquetasInput = gruposInput[1];   // segundo input de texto → etiquetas

    const descripcionInput = document.querySelector("textarea");
    const tituloTop        = document.querySelector(".top-left h2");

    const portadaInput = document.getElementById("subirPortada");
    const portadaBox   = document.querySelector(".subir-portada");

    const tipoBotones = document.querySelectorAll(".tipos button");
    const guardarBtn  = document.querySelector(".guardar-btn");

    // Selects en orden del HTML: idioma(0), derechos(1), audiencia(2)
    const selectIdioma    = document.querySelectorAll("select")[0];
    const selectDerechos  = document.querySelectorAll("select")[1];
    const selectAudiencia = document.querySelectorAll("select")[2];

    const adultoSwitch = document.querySelector(".switch input");

    // ─────────────────────────────────────────────
    // GUARDAR PORTADA EN BASE64 (comprimida)
    // ─────────────────────────────────────────────

    let portadaBase64 = "";

    portadaInput.addEventListener("change", (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        // Validar que sea imagen
        if (!archivo.type.startsWith("image/")) {
            alert("Por favor selecciona un archivo de imagen válido.");
            portadaInput.value = "";
            return;
        }

        // Comprimir la imagen antes de convertir a base64
        // para no superar el límite del servidor
        const lector = new FileReader();

        lector.onload = (evento) => {
            const img = new Image();
            img.onload = () => {
                // Máximo 600x900 px para portadas — mantiene aspect ratio
                const MAX_W = 600;
                const MAX_H = 900;

                let ancho  = img.width;
                let alto   = img.height;

                if (ancho > MAX_W || alto > MAX_H) {
                    const ratio = Math.min(MAX_W / ancho, MAX_H / alto);
                    ancho = Math.round(ancho * ratio);
                    alto  = Math.round(alto  * ratio);
                }

                const canvas = document.createElement("canvas");
                canvas.width  = ancho;
                canvas.height = alto;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, ancho, alto);

                // Calidad 0.80 → buen equilibrio tamaño/calidad
                portadaBase64 = canvas.toDataURL("image/jpeg", 0.80);

                portadaBox.innerHTML = `
                    <img
                        src="${portadaBase64}"
                        class="preview-portada"
                        style="width:100%;height:100%;object-fit:cover;border-radius:8px;"
                        alt="Portada de la historia"
                    >
                `;
            };

            img.onerror = () => {
                alert("No se pudo cargar la imagen. Intenta con otro archivo.");
                portadaInput.value = "";
            };

            img.src = evento.target.result;
        };

        lector.onerror = () => {
            alert("Error al leer el archivo. Intenta de nuevo.");
            portadaInput.value = "";
        };

        lector.readAsDataURL(archivo);
    });

    // ─────────────────────────────────────────────
    // ACTUALIZAR TÍTULO EN EL HEADER EN TIEMPO REAL
    // ─────────────────────────────────────────────

    tituloInput.addEventListener("input", () => {
        const texto = tituloInput.value.trim();
        tituloTop.textContent = texto === "" ? "Historia Sin Título" : texto;
    });

    // ─────────────────────────────────────────────
    // SELECCIONAR TIPO DE HISTORIA
    // ─────────────────────────────────────────────

    tipoBotones.forEach(btn => {
        btn.addEventListener("click", () => {
            tipoBotones.forEach(b => b.classList.remove("activo"));
            btn.classList.add("activo");
        });
    });

    // ─────────────────────────────────────────────
    // GUARDAR HISTORIA EN EL SERVIDOR
    // ─────────────────────────────────────────────

    guardarBtn.addEventListener("click", async () => {

        const titulo      = tituloInput.value.trim();
        const descripcion = descripcionInput.value.trim();

        if (titulo === "") {
            alert("El título de la historia es obligatorio.");
            tituloInput.focus();
            return;
        }

        if (descripcion === "") {
            alert("La descripción de la historia es obligatoria.");
            descripcionInput.focus();
            return;
        }

        const tipo      = document.querySelector(".tipos .activo")?.textContent?.trim() || "";
        const idioma    = selectIdioma.value;
        const derechos  = selectDerechos.value;
        const audiencia = selectAudiencia.value;
        const etiquetas = etiquetasInput ? etiquetasInput.value.trim() : "";
        const adulto    = adultoSwitch.checked;

        // Deshabilitar botón para evitar doble envío
        guardarBtn.disabled    = true;
        guardarBtn.textContent = "Guardando...";

        try {
            const payload = {
                usuario_id:       usuarioSesion.id,
                titulo:           titulo,
                descripcion:      descripcion,
                portada:          portadaBase64,   // "" si no se subió portada
                idioma:           idioma,
                categoria:        tipo,
                derechos:         derechos,
                audiencia:        audiencia,
                etiquetas:        etiquetas,
                contenido_adulto: adulto
            };

            const res = await fetch("/historias", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(payload)
            });

            // El servidor puede rechazar por tamaño (413)
            if (res.status === 413) {
                alert("La portada es demasiado grande. Intenta con una imagen más pequeña.");
                guardarBtn.disabled    = false;
                guardarBtn.textContent = "Guardar y Continuar";
                return;
            }

            if (!res.ok) {
                alert(`Error del servidor (${res.status}). Intenta de nuevo.`);
                guardarBtn.disabled    = false;
                guardarBtn.textContent = "Guardar y Continuar";
                return;
            }

            const data = await res.json();

            if (!data.success) {
                alert("Error al guardar: " + (data.error || "error desconocido"));
                guardarBtn.disabled    = false;
                guardarBtn.textContent = "Guardar y Continuar";
                return;
            }

            // Guardar IDs para que Escritura.html sepa qué abrir
            localStorage.setItem("HistoriaEditando", data.historia_id);
            localStorage.setItem("CapituloEditando", data.capitulo_id);

            location.href = "Escritura.html";

        } catch (err) {
            console.error("Error al guardar historia:", err);
            alert("No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.");
            guardarBtn.disabled    = false;
            guardarBtn.textContent = "Guardar y Continuar";
        }
    });

});