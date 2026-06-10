const historiaID =
localStorage.getItem(
"historiaLectura"
);

let indiceCapitulo = 0;

const historias =
JSON.parse(
localStorage.getItem(
"historiasREADZONE"
)
) || [];

const historia =
historias[historiaID];

const lista =
document.getElementById(
"listaCapitulos"
);

function cargarCapitulo(index){

    indiceCapitulo = index;

    const capitulo =
    historia.capitulos[index];

    document.getElementById(
    "tituloCapitulo"
    ).textContent =
    capitulo.titulo;

    document.getElementById(
    "contenidoCapitulo"
    ).innerHTML =
    capitulo.contenido;

    document
    .querySelectorAll(
    ".capitulo-item"
    )
    .forEach(
    item=>item.classList.remove(
    "capitulo-activo"
    )
    );

    document
    .querySelector(
    `[data-index="${index}"]`
    )
    .classList.add(
    "capitulo-activo"
    );

}

historia.capitulos.forEach(
(capitulo,index)=>{

    const div =
    document.createElement(
    "div"
    );

    div.className =
    "capitulo-item";

    div.dataset.index =
    index;

    div.textContent =
    capitulo.titulo;

    div.onclick =
    ()=>cargarCapitulo(
    index
    );

    lista.appendChild(
    div
    );

}
);

cargarCapitulo(0);

document.getElementById(
"btnSiguiente"
)
.addEventListener(
"click",
()=>{

    const siguiente =
    indiceCapitulo + 1;

    if(
    siguiente <
    historia.capitulos.length
    ){

        cargarCapitulo(
        siguiente
        );

    }

}
);