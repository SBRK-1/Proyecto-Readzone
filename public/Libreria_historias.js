const contenedor =
document.getElementById(
"contenedorHistorias"
);

const mensajeVacio =
document.getElementById(
"mensajeVacio"
);

let biblioteca =

JSON.parse(
localStorage.getItem(
"bibliotecaREADZONE"
)
) || [];

if(
biblioteca.length === 0
){

mensajeVacio.style.display =
"flex";

}
else{

mensajeVacio.style.display =
"none";

biblioteca.forEach(
(historia)=>{

const card =
document.createElement(
"div"
);

card.className =
"card-historia";

card.innerHTML =

`
<img src="${historia.portada}">

<div class="card-info">

<h3>
${historia.titulo}
</h3>

<p>
${historia.autor || "Autor"}
</p>

</div>
`;

contenedor.appendChild(
card
);

});

}