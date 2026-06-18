document.addEventListener("DOMContentLoaded", async () => {

    // ─────────────────────────────────────────────
    // CONFIGURACIÓN
    // ─────────────────────────────────────────────

    // Página a la que se redirige después de guardar con éxito.
    const PAGINA_DESPUES_DE_GUARDAR = "User_dise.html";

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

    let portadaBase64 = "";
    let capitulos     = [];

    // ─────────────────────────────────────────────
    // CARGAR HISTORIA DESDE EL SERVIDOR
    // ─────────────────────────────────────────────

    async function cargarHistoria() {
        try {
            const res      = await fetch(`/historia/${historiaId}`);
            const historia = await res.json();

            if (!res.ok || historia.error) {
                alert("Historia no encontrada.");
                location.href = "Modificar_historias.html";
                return;
            }

            tituloInput.value      = historia.titulo      || "";
            descripcionInput.value = historia.descripcion || "";
            etiquetasInput.value   = historia.etiquetas   || "";

            asignarSelect(idiomaSelect,    historia.idioma,    "Español");
            asignarSelect(audienciaSelect, historia.audiencia, "Adolescente");
            asignarSelect(derechosSelect,  historia.derechos,  "Todos los derechos reservados");
            asignarSelect(categoriaSelect, historia.categoria, "Acción");

            adultoCheck.checked   = !!historia.contenido_adulto;
            completaCheck.checked = !!historia.completa;

            nombreHistoriaEl.textContent = historia.titulo || "Historia Sin Título";

            if (historia.portada) {
                portadaPreview.src            = historia.portada;
                portadaPreview.style.display  = "block";
                portadaBase64                 = historia.portada;
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
            const res   = await fetch(`/capitulos/${historiaId}`);
            const datos = await res.json();

            if (!res.ok || !Array.isArray(datos)) {
                throw new Error(datos?.error || "Respuesta inválida del servidor");
            }

            capitulos = datos;
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
            card.className     = "capitulo-card";
            card.draggable     = true;
            card.dataset.index = index;
            card.dataset.id    = cap.id;

            card.innerHTML = `
                <div class="capitulo-izquierda">
                    <i class="fa-solid fa-bars arrastrar"></i>
                    <div class="capitulo-info">
                        <h3>${escapeHtml(cap.titulo || "Sin título")}</h3>
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
    }

    // Evita que un título con caracteres especiales rompa el HTML renderizado
    function escapeHtml(texto) {
        const div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
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

                document.querySelectorAll(".menu-capitulo").forEach(m => {
                    if (m !== menu) m.style.display = "none";
                });

                menu.style.display =
                    menu.style.display === "block" ? "none" : "block";
            };
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
    // CERRAR MENÚS AL HACER CLIC FUERA
    // (registrado UNA sola vez, fuera del render, para no acumular listeners)
    // ─────────────────────────────────────────────

    document.addEventListener("click", () => {
        document.querySelectorAll(".menu-capitulo")
                .forEach(m => m.style.display = "none");
    });

    // ─────────────────────────────────────────────
    // DRAG AND DROP — REORDENAR CAPÍTULOS
    // (registrado UNA sola vez sobre el contenedor; antes se registraba
    //  en cada render y eso duplicaba la reordenación)
    // ─────────────────────────────────────────────

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
        if (!destino || !arrastrado || destino === arrastrado) return;

        const origen = Number(arrastrado.dataset.index);
        const nuevo  = Number(destino.dataset.index);

        const item = capitulos.splice(origen, 1)[0];
        capitulos.splice(nuevo, 0, item);

        renderCapitulos();

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

    // ─────────────────────────────────────────────
    // NUEVO CAPÍTULO
    // ─────────────────────────────────────────────

    nuevoCapituloBtn.addEventListener("click", async () => {

        const numero = capitulos.length + 1;
        const titulo = numero === 1 ? "Prólogo" : `Capítulo ${numero}`;

        nuevoCapituloBtn.disabled = true;

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
                nuevoCapituloBtn.disabled = false;
            }

        } catch (err) {
            console.error("Error al crear capítulo:", err);
            alert("No se pudo conectar con el servidor.");
            nuevoCapituloBtn.disabled = false;
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

    portadaInput.addEventListener("change", async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        if (!archivo.type.startsWith("image/")) {
            alert("Por favor selecciona un archivo de imagen válido.");
            portadaInput.value = "";
            return;
        }

        try {
            const dataUrl = await comprimirImagen(archivo);
            portadaPreview.src           = dataUrl;
            portadaPreview.style.display = "block";
            portadaBase64                = dataUrl;
        } catch (err) {
            console.error("Error al procesar la portada:", err);
            alert("No se pudo procesar la imagen seleccionada. Intenta con otra.");
        } finally {
            portadaInput.value = "";
        }
    });

    // Redimensiona y comprime la imagen antes de convertirla a base64
    function comprimirImagen(archivo, maxAncho = 900, calidad = 0.82) {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();

            lector.onload = (ev) => {
                const img = new Image();

                img.onload = () => {
                    let { width, height } = img;

                    if (width > maxAncho) {
                        height = Math.round(height * (maxAncho / width));
                        width  = maxAncho;
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width  = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL("image/jpeg", calidad));
                };

                img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
                img.src     = ev.target.result;
            };

            lector.onerror = () => reject(new Error("No se pudo leer el archivo"));
            lector.readAsDataURL(archivo);
        });
    }

    // ─────────────────────────────────────────────
    // VISTA PREVIA DE LA HISTORIA COMPLETA
    // ─────────────────────────────────────────────

    vistaBtn.addEventListener("click", () => {
        localStorage.setItem("historiaSeleccionada", historiaId);
        window.open("Mostrar_historia.html", "_blank");
    });

    // ─────────────────────────────────────────────
    // GUARDAR CAMBIOS — solo actualiza ESTA historia
    // y redirige a la página configurada arriba
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

            if (res.ok && data.success) {
                nombreHistoriaEl.textContent = titulo;
                alert("Cambios guardados correctamente.");
                location.href = PAGINA_DESPUES_DE_GUARDAR;
                return;
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