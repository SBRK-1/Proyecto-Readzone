document.addEventListener("DOMContentLoaded", async () => {

    // ─────────────────────────────────────────────
    // ID DE LA HISTORIA — viene de Escritura.js
    // ─────────────────────────────────────────────

    const historiaId = localStorage.getItem("HistoriaEditando");

    if (!historiaId) {
        alert("No hay historia seleccionada.");
        location.href = "Modificar_historias.html";
        return;
    }

    // ─────────────────────────────────────────────
    // ELEMENTOS
    // ─────────────────────────────────────────────

    const nombreHistoriaEl = document.getElementById("nombreHistoria");
    const tituloInput      = document.getElementById("tituloHistoria");
    const descripcionInput = document.getElementById("descripcionHistoria");
    const portadaPreview   = document.getElementById("portadaPreview");
    const portadaInput     = document.getElementById("nuevaPortada");
    const idiomaSelect     = document.getElementById("idioma");
    const audienciaSelect  = document.getElementById("audiencia");
    const derechosSelect   = document.getElementById("derechos");
    const categoriaSelect  = document.getElementById("categoria");
    const etiquetasInput   = document.getElementById("etiquetas");
    const adultoCheck      = document.getElementById("contenidoAdulto");
    const completaCheck    = document.getElementById("historiaCompleta");
    const guardarBtn       = document.getElementById("guardarBtn");
    const cancelarBtn      = document.getElementById("cancelarBtn");
    const btnAtras         = document.getElementById("btnAtras");
    const vistaBtn         = document.getElementById("vistaPrevia");
    const tabs             = document.querySelectorAll(".tab");
    const detallesPanel    = document.getElementById("detallesPanel");
    const capitulosPanel   = document.getElementById("capitulosPanel");
    const listaCapitulos   = document.getElementById("listaCapitulos");
    const nuevoCapituloBtn = document.getElementById("nuevoCapituloBtn");

    // ─────────────────────────────────────────────
    // ESTADO LOCAL (solo de ESTA historia)
    // ─────────────────────────────────────────────

    let portadaBase64  = "";
    let capitulos      = [];

    // ─────────────────────────────────────────────
    // CARGAR HISTORIA DESDE EL SERVIDOR
    // ─────────────────────────────────────────────

    async function cargarHistoria() {
        try {
            const res      = await fetch(`/historia/${historiaId}`);
            const historia = await res.json();

            if (historia.error) {
                alert("Historia no encontrada.");
                location.href = "Modificar_historias.html";
                return;
            }

            // Título
            tituloInput.value      = historia.titulo      || "";
            descripcionInput.value = historia.descripcion || "";
            etiquetasInput.value   = historia.etiquetas   || "";

            // Selects — usar helper para evitar valores vacíos
            asignarSelect(idiomaSelect,    historia.idioma,    "Español");
            asignarSelect(audienciaSelect, historia.audiencia, "Adolescente");
            asignarSelect(derechosSelect,  historia.derechos,  "Todos los derechos reservados");
            asignarSelect(categoriaSelect, historia.categoria, "Acción");

            // Switches
            adultoCheck.checked   = !!historia.contenido_adulto;
            completaCheck.checked = !!historia.completa;

            // Header
            nombreHistoriaEl.textContent = historia.titulo || "Historia Sin Título";

            // Portada
            if (historia.portada) {
                portadaPreview.src     = historia.portada;
                portadaPreview.style.display = "block";
                portadaBase64          = historia.portada;
            }

        } catch (err) {
            console.error("Error al cargar historia:", err);
            alert("No se pudo conectar con el servidor.");
        }
    }

    // Asigna el valor a un select solo si existe como opción
    function asignarSelect(select, valor, porDefecto) {
        if (!valor) { select.value = porDefecto; return; }
        const opciones = Array.from(select.options).map(o => o.value || o.text);
        select.value = opciones.includes(valor) ? valor : porDefecto;
    }

    // ─────────────────────────────────────────────
    // CARGAR CAPÍTULOS DE ESTA HISTORIA ÚNICAMENTE
    // ─────────────────────────────────────────────

    async function cargarCapitulos() {
        try {
            const res  = await fetch(`/capitulos/${historiaId}`);
            capitulos  = await res.json();
            renderCapitulos();
        } catch (err) {
            console.error("Error al cargar capítulos:", err);
            listaCapitulos.innerHTML =
                `<p style="color:red;padding:16px;">Error al cargar capítulos.</p>`;
        }
    }

    // ─────────────────────────────────────────────
    // RENDERIZAR LISTA DE CAPÍTULOS
    // ─────────────────────────────────────────────

    function renderCapitulos() {

        listaCapitulos.innerHTML = "";

        if (!capitulos.length) {
            listaCapitulos.innerHTML =
                `<p style="padding:16px;color:#888;">
                    Sin capítulos aún. Crea el primero.
                </p>`;
            return;
        }

        capitulos.forEach((cap, index) => {

            const fecha = cap.fecha_creacion
                ? new Date(cap.fecha_creacion).toLocaleDateString()
                : "Sin fecha";

            const card = document.createElement("div");
            card.className       = "capitulo-card";
            card.draggable       = true;
            card.dataset.index   = index;
            card.dataset.id      = cap.id;

            card.innerHTML = `
                <div class="capitulo-izquierda">
                    <i class="fa-solid fa-bars arrastrar"></i>
                    <div class="capitulo-info">
                        <h3>${cap.titulo || "Sin título"}</h3>
                        <span>Capítulo ${index + 1} · ${fecha}</span>
                    </div>
                </div>
                <div class="capitulo-derecha">
                    <button class="menu-btn" data-index="${index}">
                        <i class="fa-solid fa-ellipsis"></i>
                    </button>
                    <div class="menu-capitulo" id="menuCap${cap.id}" style="display:none;">
                        <button class="editar-cap"   data-id="${cap.id}">Editar</button>
                        <button class="preview-cap"  data-id="${cap.id}">Vista previa</button>
                        <button class="delete-cap"   data-id="${cap.id}" data-index="${index}">
                            Eliminar
                        </button>
                    </div>
                </div>
            `;

            listaCapitulos.appendChild(card);
        });

        activarMenus();
        activarDragDrop();
    }

    // ─────────────────────────────────────────────
    // MENÚS POR CAPÍTULO
    // ─────────────────────────────────────────────

    function activarMenus() {

        // Abrir/cerrar menú
        document.querySelectorAll(".menu-btn").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const index = btn.dataset.index;
                const cap   = capitulos[index];
                const menu  = document.getElementById(`menuCap${cap.id}`);

                // Cerrar todos los demás
                document.querySelectorAll(".menu-capitulo").forEach(m => {
                    if (m !== menu) m.style.display = "none";
                });

                menu.style.display =
                    menu.style.display === "block" ? "none" : "block";
            };
        });

        // Cerrar menús al hacer clic fuera
        document.addEventListener("click", () => {
            document.querySelectorAll(".menu-capitulo")
                    .forEach(m => m.style.display = "none");
        });

        // EDITAR → ir al editor con los IDs correctos
        document.querySelectorAll(".editar-cap").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const capId = btn.dataset.id;
                localStorage.setItem("HistoriaEditando", historiaId);
                localStorage.setItem("CapituloEditando", capId);
                location.href = "Escritura.html";
            };
        });

        // VISTA PREVIA → cargar contenido fresco del servidor
        document.querySelectorAll(".preview-cap").forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const capId = btn.dataset.id;

                try {
                    const [resC, resH] = await Promise.all([
                        fetch(`/capitulo/${capId}`),
                        fetch(`/historia/${historiaId}`)
                    ]);

                    const capitulo = await resC.json();
                    const historia = await resH.json();

                    localStorage.setItem("previewREADZONE", JSON.stringify({
                        titulo:         capitulo.titulo,
                        contenido:      capitulo.contenido,
                        portada:        historia.portada,
                        nombreHistoria: historia.titulo
                    }));

                    window.open("vista_previa.html", "_blank");

                } catch (err) {
                    console.error("Error en vista previa:", err);
                    alert("No se pudo cargar la vista previa.");
                }
            };
        });

        // ELIMINAR capítulo
        document.querySelectorAll(".delete-cap").forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();

                if (!confirm("¿Eliminar este capítulo? No se puede deshacer.")) return;

                const capId    = btn.dataset.id;
                const capIndex = Number(btn.dataset.index);

                try {
                    const res  = await fetch(`/capitulo/${capId}`, { method: "DELETE" });
                    const data = await res.json();

                    if (data.success) {
                        capitulos.splice(capIndex, 1);
                        renderCapitulos();
                    } else {
                        alert("Error al eliminar: " + (data.error || "desconocido"));
                    }

                } catch (err) {
                    console.error("Error al eliminar:", err);
                    alert("No se pudo conectar con el servidor.");
                }
            };
        });
    }

    // ─────────────────────────────────────────────
    // DRAG AND DROP — REORDENAR CAPÍTULOS
    // ─────────────────────────────────────────────

    function activarDragDrop() {

        let arrastrado = null;

        listaCapitulos.addEventListener("dragstart", e => {
            arrastrado = e.target.closest(".capitulo-card");
            arrastrado?.classList.add("arrastrando");
        });

        listaCapitulos.addEventListener("dragend", () => {
            arrastrado?.classList.remove("arrastrando");
        });

        listaCapitulos.addEventListener("dragover", e => e.preventDefault());

        listaCapitulos.addEventListener("drop", async e => {
            e.preventDefault();

            const destino = e.target.closest(".capitulo-card");
            if (!destino || destino === arrastrado) return;

            const origen = Number(arrastrado.dataset.index);
            const nuevo  = Number(destino.dataset.index);

            // Reordenar array en memoria
            const item = capitulos.splice(origen, 1)[0];
            capitulos.splice(nuevo, 0, item);

            renderCapitulos();

            // Persistir nuevo orden solo para ESTA historia
            try {
                await fetch("/capitulos/reordenar", {
                    method:  "PUT",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({
                        historia_id: historiaId,
                        orden: capitulos.map((c, i) => ({
                            id:              c.id,
                            numero_capitulo: i + 1
                        }))
                    })
                });
            } catch (err) {
                console.error("Error al guardar orden:", err);
            }
        });
    }

    // ─────────────────────────────────────────────
    // NUEVO CAPÍTULO
    // ─────────────────────────────────────────────

    nuevoCapituloBtn.addEventListener("click", async () => {

        const numero = capitulos.length + 1;
        const titulo = numero === 1 ? "Prólogo" : `Capítulo ${numero}`;

        try {
            const res  = await fetch("/capitulos", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    historia_id:     historiaId,
                    titulo:          titulo,
                    contenido:       "",
                    numero_capitulo: numero
                })
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem("HistoriaEditando", historiaId);
                localStorage.setItem("CapituloEditando", data.capitulo_id);
                location.href = "Escritura.html";
            } else {
                alert("Error al crear: " + (data.error || "desconocido"));
            }

        } catch (err) {
            console.error("Error al crear capítulo:", err);
            alert("No se pudo conectar con el servidor.");
        }
    });

    // ─────────────────────────────────────────────
    // CAMBIO DE PESTAÑAS
    // ─────────────────────────────────────────────

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("activo"));
            tab.classList.add("activo");

            if (tab.dataset.tab === "detalles") {
                detallesPanel.classList.remove("oculto");
                capitulosPanel.classList.add("oculto");
            } else {
                capitulosPanel.classList.remove("oculto");
                detallesPanel.classList.add("oculto");
            }
        });
    });

    // ─────────────────────────────────────────────
    // TÍTULO EN TIEMPO REAL
    // ─────────────────────────────────────────────

    tituloInput.addEventListener("input", () => {
        nombreHistoriaEl.textContent =
            tituloInput.value.trim() || "Historia Sin Título";
    });

    // ─────────────────────────────────────────────
    // CAMBIAR PORTADA
    // ─────────────────────────────────────────────

    document.getElementById("editarPortada").addEventListener("click", () => {
        portadaInput.click();
    });

    portadaInput.addEventListener("change", e => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        const lector = new FileReader();
        lector.onload = ev => {
            portadaPreview.src           = ev.target.result;
            portadaPreview.style.display = "block";
            portadaBase64                = ev.target.result;
        };
        lector.readAsDataURL(archivo);
    });

    // ─────────────────────────────────────────────
    // VISTA PREVIA DE LA HISTORIA COMPLETA
    // ─────────────────────────────────────────────

    vistaBtn.addEventListener("click", () => {
        localStorage.setItem("historiaSeleccionada", historiaId);
        window.open("Mostrar_historia.html", "_blank");
    });

    // ─────────────────────────────────────────────
    // GUARDAR CAMBIOS — solo actualiza ESTA historia
    // ─────────────────────────────────────────────

    guardarBtn.addEventListener("click", async () => {

        const titulo      = tituloInput.value.trim();
        const descripcion = descripcionInput.value.trim();

        if (!titulo || !descripcion) {
            alert("Completa el título y la descripción.");
            return;
        }

        guardarBtn.disabled    = true;
        guardarBtn.textContent = "Guardando...";

        try {
            const res = await fetch(`/historia/${historiaId}`, {
                method:  "PUT",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    titulo,
                    descripcion,
                    portada:          portadaBase64,
                    idioma:           idiomaSelect.value,
                    categoria:        categoriaSelect.value,
                    derechos:         derechosSelect.value,
                    audiencia:        audienciaSelect.value,
                    etiquetas:        etiquetasInput.value.trim(),
                    contenido_adulto: adultoCheck.checked,
                    completa:         completaCheck.checked
                })
            });

            const data = await res.json();

            if (data.success) {
                alert("Cambios guardados correctamente.");
                nombreHistoriaEl.textContent = titulo;
            } else {
                alert("Error al guardar: " + (data.error || "desconocido"));
            }

        } catch (err) {
            console.error("Error al guardar:", err);
            alert("No se pudo conectar con el servidor.");
        }

        guardarBtn.disabled    = false;
        guardarBtn.textContent = "Guardar";
    });

    // ─────────────────────────────────────────────
    // CANCELAR → volver al editor sin guardar
    // ─────────────────────────────────────────────

    cancelarBtn.addEventListener("click", () => {
        if (confirm("¿Cancelar los cambios y volver al editor?")) {
            location.href = "Escritura.html";
        }
    });

    // ─────────────────────────────────────────────
    // BOTÓN ATRÁS → volver a Modificar_historias
    // ─────────────────────────────────────────────

    btnAtras.addEventListener("click", () => {
        if (confirm("¿Volver a tus historias? Los cambios no guardados se perderán.")) {
            location.href = "Modificar_historias.html";
        }
    });

    // ─────────────────────────────────────────────
    // INICIO — cargar datos de ESTA historia
    // ─────────────────────────────────────────────

    await cargarHistoria();
    await cargarCapitulos();
});