document.addEventListener("DOMContentLoaded", () => {
    // ELEMENTOS
    const tituloInput = document.querySelectorAll(".grupo input")[0];
    const descripcionInput = document.querySelector("textarea");
    const tituloTop = document.querySelector(".top-left h2");

    const portadaInput = document.getElementById("subirPortada");
    const portadaBox = document.querySelector(".subir-portada");

    const tipoBotones = document.querySelectorAll(".tipos button");

    const agregarBtn = document.querySelector(".agregar-btn");

    const guardarBtn = document.querySelector(".guardar-btn");
    const cancelarBtn = document.querySelector(".cancelar-btn");

    const selects = document.querySelectorAll("select");
    const etiquetasInput = document.querySelectorAll(".grupo input")[1];
    const adultoSwitch = document.querySelector(".switch input");

    // ACTUALIZAR TIPO ARRIBA

    tituloInput.addEventListener("input", () => {

        const texto = tituloInput.value.trim();

        if(texto === ""){
            tituloTop.textContent = "Historia Sin Título";
        }else{
            tituloTop.textContent = texto;
        }
    });

    let portadaGuardada = "";
    // PORTADA PREVIA

    portadaInput.addEventListener("change", (e) => {

        const archivo = e.target.files[0];

        if(!archivo) return;

        const lector = new FileReader();

        lector.onload = function(evento){

            portadaGuardada = evento.target.result;
            portadaBox.innerHTML = `
                <img src="${evento.target.result}" class="preview-portada">
            `;
        }

        lector.readAsDataURL(archivo);
    });

    // SELECCIONAR TIPO
    tipoBotones.forEach(btn => {

        btn.addEventListener("click", () => {

            tipoBotones.forEach(b => {
                b.classList.remove("activo");
            });

            btn.classList.add("activo");
        });
    });

    // GUARDAR DATOS
    guardarBtn.addEventListener("click", () => {

        const titulo = tituloInput.value.trim();
        const descripcion = descripcionInput.value.trim();

        if(titulo === "" || descripcion === ""){
            alert("Completa el título y la descripción");
            return;
        }

        const personajes = [];

        document.querySelectorAll(".personaje-item span")
        .forEach(p => {
            personajes.push(p.textContent);
    });

    const datosHistoria = {

        // NUEVA FORMA DE GUARDAR
        id: Date.now().toString(),

        titulo: tituloInput.value.trim(),
        descripcion: descripcionInput.value.trim(),
        idioma: selects[0].value,
        tipo: document.querySelector(".tipos .activo")?.textContent || "",
        etiquetas: etiquetasInput.value,
        derechos: selects[1].value,
        contenidoAdulto: adultoSwitch.checked,
        audiencia: selects[2].value,
        portada: portadaGuardada
};
    // OBTENER HISTORIAS
    const historias =
    JSON.parse(localStorage.getItem("historiasREADZONE")) || [];

    // EVITAR DUPLICADOS
    const existe = historias.some(h =>
        h.titulo.toLowerCase() ===
        datosHistoria.titulo.toLowerCase()
    );

    if(existe){
        alert("Ya existe una historia con ese título");
        return;
    }

    // GUARDAR
    historias.push(datosHistoria);

    localStorage.setItem(
        "historiasREADZONE",
        JSON.stringify(historias)
    );

    // GUARDAR ID DE LAS HISTORIAS
    localStorage.setItem(
        "historiasActualID",
        datosHistoria.id
    );

    alert("Historia guardada correctamente");

    window.location.replace("Escritura.html");
});

    // CANCELAR
    cancelarBtn.addEventListener("click", () => {

        const confirmar = confirm(
            "¿Seguro que quieres cancelar?"
        );

        if(confirmar){
            location.reload();
        }
    });

});