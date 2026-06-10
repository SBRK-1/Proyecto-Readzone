const lista =
document.getElementById("listaHistorias");

let historias =
JSON.parse(
localStorage.getItem("historiasREADZONE")
) || [];

mostrarHistorias();

document
.getElementById("crearHistoria")
.addEventListener("click",(e)=>{

e.preventDefault();

let historias =
JSON.parse(
localStorage.getItem("historiasREADZONE")
) || [];

const nuevaHistoria = {

titulo:"Nueva Historia",

contenido:"",

portada:"./imagenes/Asa-mitaka.jpg",

imagen:"",

video:"",

capitulos:[
    {
        titulo:"Prologo",

        contenido:"",

        ultimaEdicion: new Date().toLocaleString()

    }
]

};

historias.push(nuevaHistoria);

localStorage.setItem(
"historiasREADZONE",
JSON.stringify(historias)
);

const nuevoIndex =
historias.length - 1;

localStorage.setItem(
"HistoriaEditando",
nuevoIndex
);

location.href =
"Escritura.html";

});

function mostrarHistorias(){

    lista.innerHTML = "";

    historias.forEach((historia,index)=>{

        const card =
        document.createElement("div");

        card.classList.add("card-historia");

        card.innerHTML = `

        <img
        src="${historia.portada}"
        class="portada">

        <div class="info">

            <h2>${historia.titulo}</h2>

            <p class="fecha">
                Última edición:
                ${new Date().toLocaleDateString()}
            </p>

            <div class="acciones">

                <button
                onclick="abrirMenu(${index})">

                    Continuar
                    <i class="fa-solid fa-chevron-down"></i>

                </button>

                <div
                class="menu"
                id="menu${index}">

                    <button
                    onclick="editarHistoria(${index})">

                        Editar historia
                    </button>

                    <button
                    onclick="eliminarHistoria(${index})">

                        Eliminar historia
                    </button>

                </div>

            </div>

        </div>

        <!-- NUEVO BOTÓN SIGUE ESCRIBIENDO -->

        <div class="seguir-escribiendo">

            <button
            class="btn-seguir"
            onclick="mostrarCapitulos(${index})">

                Sigue escribiendo
                <i class="fa-solid fa-chevron-down"></i>

            </button>

            <div
            class="menu-capitulos"
            id="capitulos${index}">

                <div
                    class="lista-capitulos"
                    id="listaCapitulos${index}">
                </div>

                <button
                    class="btn-nueva-parte"
                    onclick="crearCapitulo(${index})">

                        <i class="fa-solid fa-plus"></i>

                        Parte Nueva

                </button>
            </div>
        </div>`;

        lista.appendChild(card);
    });
}

function abrirMenu(index){

    const menu =
    document.getElementById(
    `menu${index}`);

    menu.style.display =
    menu.style.display === "block"
    ? "none"
    : "block";
}

function editarHistoria(index){

    localStorage.setItem(
    "HistoriaEditando",
    index);

    location.href =
    "Escritura.html";
}

function eliminarHistoria(index){

    if(
    confirm(
    "¿Eliminar esta historia?"
    )
    ){

        historias.splice(index,1);

        localStorage.setItem(
        "historiasREADZONE",
        JSON.stringify(historias)
        );

        mostrarHistorias();

    }
}

// Crear Capitulos Nuevos
function crearCapitulo(index){

    let historias =

    JSON.parse(
    localStorage.getItem(
    "historiasREADZONE"
    )
    ) || [];

    if(
    !historias[index]
    .capitulos
    ){

        historias[index]
        .capitulos = [];
    }

    historias[index]
    .capitulos.push({

        titulo:
        "Parte " +
        (
        historias[index]
        .capitulos.length + 1
        ),

        contenido:"",

        ultimaEdicion:
        new Date()
        .toLocaleString()

    });

    localStorage.setItem(

        "historiasREADZONE",

        JSON.stringify(
        historias
        )

    );

    cargarCapitulos(index);
}

// Mostrar menu
function mostrarCapitulos(index){

    const menu =
    document.getElementById(
    `capitulos${index}`
    );

    if(
    menu.style.display ===
    "block"
    ){

        menu.style.display =
        "none";

        return;
    }

    menu.style.display =
    "block";

    cargarCapitulos(index);
}

function cargarCapitulos(index){

    let historias =

    JSON.parse(
    localStorage.getItem(
    "historiasREADZONE"
    )
    ) || [];

    const lista =

    document.getElementById(
    `listaCapitulos${index}`
    );

    lista.innerHTML = "";

    const capitulos =

    historias[index]
    .capitulos || [];

    capitulos.forEach(
    (capitulo,pos)=>{

        lista.innerHTML +=

        `
        <div
        class="capitulo-item"

        onclick="
        abrirCapitulo(
        ${index},
        ${pos}
        )">

            <strong>

            ${capitulo.titulo}

            </strong>

            <br>

            <small>

            ${capitulo.ultimaEdicion}

            </small>

        </div>
        `;
    });
}

// Abrir capotulo en especifico
function abrirCapitulo(
historiaIndex,
capituloIndex
){

    localStorage.setItem(
    "HistoriaEditando",
    historiaIndex
    );

    localStorage.setItem(
    "CapituloEditando",
    capituloIndex
    );

    location.href =
    "Escritura.html";
}