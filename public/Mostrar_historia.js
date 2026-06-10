const historiaID =
localStorage.getItem(
"historiaSeleccionada"
);

const historias =
JSON.parse(
localStorage.getItem(
"historiasREADZONE"
)
) || [];

const historia =
historias[historiaID];

document.getElementById(
"tituloHistoria"
).textContent =
historia.titulo;

document.getElementById(
"autorHistoria"
).textContent =
historia.autor;

document.getElementById(
"descripcionHistoria"
).textContent =
historia.descripcion;

document.getElementById(
"vistas"
).textContent =
historia.vistas || 0;

document.getElementById(
"votos"
).textContent =
historia.votos || 0;

document.getElementById(
"cantidadCapitulos"
).textContent =
historia.capitulos.length;

document.getElementById(
"portadaHistoria"
).src =
historia.portada;

const lista =
document.getElementById(
"listaCapitulos"
);

historia.capitulos.forEach(
(capitulo,index)=>{

    const div =
    document.createElement(
    "div"
    );

    div.className =
    "capitulo";

    div.innerHTML =
    `<strong>
    ${capitulo.titulo}
    </strong>`;

    div.onclick = ()=>{

        localStorage.setItem(
        "historiaLectura",
        historiaID
        );

        localStorage.setItem(
        "capituloInicial",
        index
        );

        location.href =
        "Leer_capitulo.html";
    };

    lista.appendChild(div);

}
);

document.getElementById(
"btnLeer"
).onclick = ()=>{

    localStorage.setItem(
    "historiaLectura",
    historiaID
    );

    location.href =
    "Leer_capitulo.html";
};

/* ========================= */
/* CAMBIO DE PESTAÑAS */
/* ========================= */

const botonesTabs =
document.querySelectorAll(
".tab-btn"
);

const resumen =
document.getElementById(
"tabResumen"
);

const capitulos =
document.getElementById(
"tabCapitulos"
);

botonesTabs.forEach(btn=>{

    btn.addEventListener(
    "click",
    ()=>{

        botonesTabs.forEach(
        b=>b.classList.remove(
        "activo"
        )
        );

        btn.classList.add(
        "activo"
        );

        resumen.classList.remove(
        "activo"
        );

        capitulos.classList.remove(
        "activo"
        );

        if(
        btn.dataset.tab ===
        "resumen"
        ){
            resumen.classList.add(
            "activo"
            );
        }
        else{
            capitulos.classList.add(
            "activo"
            );
        }

    }
    );

});