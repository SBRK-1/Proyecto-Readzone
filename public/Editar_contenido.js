document.addEventListener("DOMContentLoaded", () => {
    // ==========================
    // ELEMENTOS
    // ==========================

    const nombreHistoria = document.getElementById("nombreHistoria");

    const tituloInput =
        document.getElementById("tituloHistoria");

    const descripcionInput =
        document.getElementById("descripcionHistoria");

    const portadaPreview =
        document.getElementById("portadaPreview");

    const portadaInput =
        document.getElementById("nuevaPortada");

    const idiomaSelect =
        document.getElementById("idioma");

    const audienciaSelect =
        document.getElementById("audiencia");

    const derechosSelect =
        document.getElementById("derechos");

    const categoriaSelect =
        document.getElementById("categoria");

    const etiquetasInput =
        document.getElementById("etiquetas");

    const contenidoAdulto =
        document.getElementById("contenidoAdulto");

    const historiaCompleta =
        document.getElementById("historiaCompleta");

    const guardarBtn =
        document.querySelector(".guardar-btn");

    const cancelarBtn =
        document.querySelector(".cancelar-btn");

    const detallesPanel =
    document.getElementById(
        "detallesPanel"
    );

    const capitulosPanel =
        document.getElementById(
            "capitulosPanel"
        );

    const tabs =
        document.querySelectorAll(".tab");

    const listaCapitulos =
        document.getElementById(
            "listaCapitulos"
        );

    const nuevoCapituloBtn =
        document.querySelector(
            ".nuevo-capitulo-btn"
        );

    /* ===================================
        OBTENER ID DE HISTORIA ACTUAL
    =================================== */

    const historiaID =
        localStorage.getItem(
            "historiaActualID"
        );

    /* ===================================
        BUSCAR HISTORIA ESPECÍFICA
    =================================== */

    const historias =
        JSON.parse(
            localStorage.getItem(
                "historiasREADZONE"
            )
        ) || [];

    let historia =
        historias.find(
            h => h.id === historiaID
        ) || {};

    // ==========================
    // CARGAR DATOS
    // ==========================

    function cargarDatos() {

        tituloInput.value =
            historia.titulo || "";

        descripcionInput.value =
            historia.descripcion || "";

        idiomaSelect.value =
            historia.idioma || "Español";

        audienciaSelect.value =
            historia.audiencia ||
            "Adolescente";

        derechosSelect.value =
            historia.derechos ||
            "Todos los derechos reservados";

        etiquetasInput.value =
            historia.etiquetas || "";

        contenidoAdulto.checked =
            historia.contenidoAdulto || false;

        historiaCompleta.checked =
            historia.completa || false;

        nombreHistoria.textContent =
            historia.titulo ||
            "Historia Sin Título";

        if(historia.portada){

            portadaPreview.src =
                historia.portada;

        }

    }

    cargarDatos();

    // ==========================
    // CAMBIO DE PESTAÑAS
    // ==========================

    tabs.forEach(tab=>{

        tab.addEventListener("click",()=>{

            tabs.forEach(
                t=>t.classList.remove(
                    "activo"
                )
            );

            tab.classList.add(
                "activo"
            );

            const destino =
                tab.dataset.tab;

            if(destino==="detalles"){

                detallesPanel.classList.remove(
                    "oculto"
                );

                capitulosPanel.classList.add(
                    "oculto"
                );

            }else{

                capitulosPanel.classList.remove(
                    "oculto"
                );

                detallesPanel.classList.add(
                    "oculto"
                );

            }

        });

    });

    // ==========================
    // RENDERIZAR CAPITULOS
    // ==========================

    function renderCapitulos(){

        listaCapitulos.innerHTML = "";

        historia.capitulos.forEach(
            (capitulo,index)=>{

            const card =
            document.createElement("div");

            card.className =
            "capitulo-card";

            card.draggable = true;

            card.dataset.index =
            index;

            card.innerHTML = `

                <div class="capitulo-izquierda">

                    <i class="fa-solid fa-bars arrastrar"></i>

                    <div class="capitulo-info">

                        <h3>${capitulo.titulo}</h3>

                        <span>
                            Capítulo ${index+1}
                        </span>

                    </div>

                </div>

                <div class="capitulo-derecha">

                    <button class="menu-btn">

                        <i class="fa-solid fa-ellipsis"></i>

                    </button>

                    <div class="menu-capitulo">

                        <button
                        class="preview-cap">

                            Vista previa

                        </button>

                        <button
                        class="delete-cap">

                            Eliminar

                        </button>

                    </div>

                </div>
            `;

            listaCapitulos.appendChild(
                card
            );

        });

        activarMenus();

    }

    // ==========================
    // NUEVO CAPITULO
    // ==========================

    nuevoCapituloBtn.addEventListener(
    "click",()=>{

        const numero =
        historia.capitulos.length+1;

        historia.capitulos.push({

            id:Date.now(),

            titulo:
            `Capítulo ${numero}`,

            contenido:""

        });

        renderCapitulos();

    });

    // ==========================
    // MENUS DE CAPITULOS
    // ==========================

function activarMenus(){

    document
    .querySelectorAll(".menu-btn")
    .forEach(btn=>{

        btn.onclick = ()=>{

            const menu =
            btn.nextElementSibling;

            menu.style.display =
            menu.style.display==="block"
            ? "none"
            : "block";

        };

    });

    document
    .querySelectorAll(".delete-cap")
    .forEach((btn,index)=>{

        btn.onclick = ()=>{

            if(
                confirm(
                "¿Eliminar capítulo?"
                )
            ){

                historia.capitulos.splice(
                    index,
                    1
                );

                renderCapitulos();

            }

        };

    });

    document
    .querySelectorAll(".preview-cap")
    .forEach((btn,index)=>{

        btn.onclick = ()=>{

            const capitulo =
            historia.capitulos[index];

            localStorage.setItem(

                "previewREADZONE",

                JSON.stringify({

                    titulo:
                    capitulo.titulo,

                    contenido:
                    capitulo.contenido,

                    portada:
                    historia.portada,

                    nombreHistoria:
                    historia.titulo

                })
            );

            window.open(
                "vista_previa.html",
                "_blank"
            );

        };

    });

}

// ==========================
// ORDENAR CAPITULOS
// ==========================

let capituloArrastrado = null;

listaCapitulos.addEventListener(
"dragstart",
e=>{

    capituloArrastrado =
    e.target.closest(
        ".capitulo-card"
    );

});

listaCapitulos.addEventListener(
    "dragover",
    e=>{
        e.preventDefault();

});

listaCapitulos.addEventListener(
"drop",
e=>{

    e.preventDefault();

    const destino =
    e.target.closest(
        ".capitulo-card"
    );

    if(
        !destino ||
        destino===capituloArrastrado
    ){
        return;
    }

    const origen =
    Number(
        capituloArrastrado.dataset.index
    );

    const nuevo =
    Number(
        destino.dataset.index
    );

    const item =
    historia.capitulos.splice(
        origen,
        1
    )[0];

    historia.capitulos.splice(
        nuevo,
        0,
        item
    );

    renderCapitulos();

});

    // ==========================
    // ACTUALIZAR TITULO ARRIBA
    // ==========================

    tituloInput.addEventListener("input", () => {

        const texto =
            tituloInput.value.trim()

        nombreHistoria.textContent =
            texto || "Historia Sin Título";
    });

    // ==========================
    // CAMBIAR PORTADA
    // ==========================

    portadaInput.addEventListener("change", e => {

        const archivo =
            e.target.files[0];

        if(!archivo) return;

        const lector =
            new FileReader();

        lector.onload = evento => {

            portadaPreview.src =
                evento.target.result;

            historia.portada =
                evento.target.result;
        };

        lector.readAsDataURL(archivo);
    });

    // ==========================
    // GUARDAR
    // ==========================

    guardarBtn.addEventListener("click", ()=>{

        historia.titulo =
            tituloInput.value.trim();

        historia.descripcion =
            descripcionInput.value.trim();

        historia.idioma =
            idiomaSelect.value;

        historia.audiencia =
            audienciaSelect.value;

        historia.derechos =
            derechosSelect.value;

        historia.categoria =
            categoriaSelect.value;

        historia.etiquetas =
            etiquetasInput.value;

        historia.contenidoAdulto =
            contenidoAdulto.checked;

        historia.completa =
            historiaCompleta.checked;

        if(
            historia.titulo === "" ||
            historia.descripcion === ""
        ){
            alert(
                "Completa el título y la descripción."
            );
            return;
        }

        historia.capitulos = historia.capitulos || [];

        // Actualizar historia actual

        localStorage.setItem(
            "historiaActualREADZONE",
            JSON.stringify(historia)
        );

        // Actualizar lista completa

        let historias =
            JSON.parse(
                localStorage.getItem(
                    "historiasREADZONE"
                )
            ) || [];

        // Capitulos
        if(!historia.capitulos){
            historia.capitulos = [];
        }
        /* ===================================
            BUSCAR POR ID Y NO POR TITULO
        =================================== */

        const indice =
            historias.findIndex(
                h => h.id === historia.id
            );

        if(indice !== -1){

            historias[indice] =
                historia;

        }

        localStorage.setItem(
            "historiasREADZONE",
            JSON.stringify(historias)
        );

        alert(
            "Cambios guardados correctamente"
        );
    });

    // ==========================
    // CANCELAR
    // ==========================

    cancelarBtn.addEventListener("click", ()=>{

        const confirmar =
            confirm(
                "¿Deseas cancelar los cambios?"
            );

        if(confirmar){

            location.reload();
        }
    });
renderCapitulos();
});