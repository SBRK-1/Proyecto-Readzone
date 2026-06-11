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

    const tituloInput      = document.querySelectorAll(".grupo input")[0];
    const descripcionInput = document.querySelector("textarea");
    const tituloTop        = document.querySelector(".top-left h2");

    const portadaInput = document.getElementById("subirPortada");
    const portadaBox   = document.querySelector(".subir-portada");

    const tipoBotones    = document.querySelectorAll(".tipos button");
    const guardarBtn     = document.querySelector(".guardar-btn");
    const selects        = document.querySelectorAll("select");
    const etiquetasInput = document.querySelectorAll(".grupo input")[1];
    const adultoSwitch   = document.querySelector(".switch input");

    // ─────────────────────────────────────────────
    // ACTUALIZAR TÍTULO EN EL HEADER EN TIEMPO REAL
    // ─────────────────────────────────────────────

    tituloInput.addEventListener("input", () => {
        const texto = tituloInput.value.trim();
        tituloTop.textContent = texto === "" ? "Historia Sin Título" : texto;
    });

    // ─────────────────────────────────────────────
    // PORTADA — PREVISUALIZACIÓN
    // ─────────────────────────────────────────────

    let portadaBase64 = "";

    portadaInput.addEventListener("change", (e) => {

        const archivo = e.target.files[0];
        if (!archivo) return;

        const lector = new FileReader();

        lector.onload = (evento) => {
            portadaBase64 = evento.target.result;
            portadaBox.innerHTML = `
                <img src="${portadaBase64}" class="preview-portada"
                     style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
            `;
        };

        lector.readAsDataURL(archivo);
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

        if (titulo === "" || descripcion === "") {
            alert("Completa el título y la descripción.");
            return;
        }

        const tipo        = document.querySelector(".tipos .activo")?.textContent || "";
        const idioma      = selects[0].value;
        const derechos    = selects[1].value;
        const audiencia   = selects[2].value;
        const etiquetas   = etiquetasInput.value.trim();
        const adulto      = adultoSwitch.checked;

        guardarBtn.disabled   = true;
        guardarBtn.textContent = "Guardando...";

        try {
            const res = await fetch("/historias", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuario_id:       usuarioSesion.id,
                    titulo:           titulo,
                    descripcion:      descripcion,
                    portada:          portadaBase64,
                    idioma:           idioma,
                    categoria:        tipo,
                    derechos:         derechos,
                    audiencia:        audiencia,
                    etiquetas:        etiquetas,
                    contenido_adulto: adulto
                })
            });

            const data = await res.json();

            if (!data.success) {
                alert("Error al guardar: " + (data.error || "desconocido"));
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
            alert("No se pudo conectar con el servidor.");
            guardarBtn.disabled    = false;
            guardarBtn.textContent = "Guardar y Continuar";
        }
    });

});