/* ==========================
ELEMENTOS
========================== */

const titulo =
document.getElementById(
"tituloCapitulo"
);

const contenido =
document.getElementById(
"contenidoCapitulo"
);

const estado =
document.getElementById(
"estadoGuardado"
);

const toast =
document.getElementById(
"toastGuardado"
);

const contadorPalabras =
document.getElementById(
"contadorPalabras"
);

const contadorCaracteres =
document.getElementById(
"contadorCaracteres"
);

const nombreHistoria =
document.getElementById(
"nombreHistoria"
);

const descripcionHistoriaMini =
document.getElementById(
"descripcionHistoriaMini"
);

const btnVolver =
document.getElementById(
"btnVolver"
);

const portadaHistoria =
document.getElementById(
"portadaHistoria"
);

const btnGuardar =
document.getElementById(
"btnGuardar"
);

const btnVistaPrevia =
document.getElementById(
"btnVistaPrevia"
);

const btnPublicar =
document.getElementById(
"btnPublicar"
);

const editor =
document.getElementById(
"contenidoCapitulo"
);

const insertarImagen =
document.getElementById(
"insertarImagen"
);

/* ==========================
VARIABLES
========================== */

let imagenGuardada = "";
let videoGuardado = "";

const idHistoria =
localStorage.getItem(
"historiaActualID"
);

/* ==========================
CARGAR HISTORIA
========================== */

window.addEventListener(
"DOMContentLoaded",
()=>{

let historias =
JSON.parse(
localStorage.getItem(
"historiasREADZONE"
)
) || [];

if(
idHistoria === null ||
!historias[idHistoria]
){
return;
}

const historia =
historias[idHistoria];

titulo.value =
historia.titulo || "";

contenido.innerHTML =
historia.contenido || "";

imagenGuardada =
historia.imagen || "";

videoGuardado =
historia.video || "";

nombreHistoria.textContent =
historia.titulo ||
"Nueva Historia";

descripcionHistoriaMini.textContent =

historia.descripcion ||

"Sin descripción";

if(
historia.portada
){

portadaHistoria.src =
historia.portada;

}

actualizarContador();

actualizarFecha();
});

/* ==========================
CONTADORES
========================== */

contenido.addEventListener(
"input",
actualizarContador
);

function actualizarContador(){

const texto = contenido.innerText.trim();

const palabras = texto
? texto.split(/\s+/)
: [];

contadorPalabras.textContent =
palabras.length +
" palabras";

contadorCaracteres.textContent =
contenido.innerText.length +
" caracteres";

}

/* ==========================
CAMBIOS
========================== */

insertarImagen.addEventListener(
"click",
()=>{

document
.getElementById(
"inputImagen"
)
.click();

});

titulo.addEventListener(
"input",
marcarSinGuardar
);

titulo.addEventListener(
"input",
()=>{
nombreHistoria.textContent =
titulo.value ||
"Nueva Historia";
}
);

contenido.addEventListener(
"input",
marcarSinGuardar
);

document.getElementById(
"inputImagen"
).addEventListener(
"change",
marcarSinGuardar
);

document.getElementById(
"inputVideo"
).addEventListener(
"change",
marcarSinGuardar
);

function marcarSinGuardar(){

estado.classList.remove(
"guardado"
);

estado.innerHTML =

`
<i class="fa-solid
fa-cloud"></i>

Sin guardar
`;

}

/* ==========================
IMAGEN
========================== */

document
.getElementById(
"inputImagen"
)
.addEventListener(
"change",
function(){

const archivo =
this.files[0];

if(!archivo) return;

const lector =
new FileReader();

lector.onload =
(e)=>{

const url =
e.target.result;

editor.focus();

document.execCommand(

"insertHTML",

false,

`
<div class="bloque-media">

<button class="btn-eliminar-media">
✖
</button>

<img
src="${url}"
class="imagen-capitulo">

</div>
`

);

editor.innerHTML += "<p><br></p>";

editor.focus();

};

lector.readAsDataURL(
archivo
);

this.value = "";

});

/* ==========================
VIDEO
========================== */

document
.getElementById(
"inputVideo"
)
.addEventListener(
"change",
function(){

const archivo =
this.files[0];

if(!archivo) return;

const lector =
new FileReader();

lector.onload =
(e)=>{

const url =
e.target.result;

editor.focus();

document.execCommand(

"insertHTML",

false,

`
<div class="bloque-media">

<button class="btn-eliminar-media">
✖
</button>

<video
controls
src="${url}">

</video>

</div>
`

);

editor.innerHTML += "<p><br></p>";

editor.focus();

};

lector.readAsDataURL(
archivo
);

this.value = "";

});

/* ==========================
GUARDAR
========================== */

btnGuardar.addEventListener(
"click",
guardarHistoria
);

function guardarHistoria(){

estado.innerHTML =

`
<i class="fa-solid
fa-circle-notch
girando"></i>

Guardando...
`;

let historias =

JSON.parse(
localStorage.getItem(
"historiasREADZONE"
)
) || [];

if(
!historias[idHistoria]
){

alert(
"No hay una historia seleccionada"
);

return;
}

historias[idHistoria] = {

...historias[idHistoria],

titulo:
titulo.value,

contenido:
contenido.innerHTML,

portada:
imagenGuardada ||
historias[idHistoria]
?.portada,

imagen:
imagenGuardada,

video:
videoGuardado,

ultimaEdicion:
new Date()
.toLocaleString()

};

localStorage.setItem(

"historiasREADZONE",

JSON.stringify(
historias
)

);

nombreHistoria
.textContent =

titulo.value ||
"Nueva Historia";

estado.innerHTML =

`
<i class="fa-solid
fa-check"></i>

Guardado correctamente
`;

estado.classList.add(
"guardado"
);

mostrarToast();

actualizarFecha();

}

/* ==========================
TOAST
========================== */

function mostrarToast(){

toast.classList.add(
"activo"
);

setTimeout(()=>{

toast.classList.remove(
"activo"
);

},2500);

}

/* ==========================
FECHA
========================== */

function actualizarFecha(){

const fecha =

document.getElementById(
"ultimaEdicion"
);

let historias =

JSON.parse(
localStorage.getItem(
"historiasREADZONE"
)
) || [];

if(
!historias[idHistoria]
){
return;
}

fecha.textContent =

"Última edición: " +

(
historias[idHistoria]
.ultimaEdicion

||

"Nunca"
);

}

/* ==========================
AUTOGUARDADO
========================== */

setInterval(()=>{

if(
idHistoria === null
){
return;
}

let historias =

JSON.parse(
localStorage.getItem(
"historiasREADZONE"
)
) || [];

if(
!historias[idHistoria]
){
return;
}

historias[idHistoria] = {

...historias[idHistoria],

titulo:
titulo.value,

contenido:
contenido.innerHTML,

portada:
imagenGuardada ||
historias[idHistoria]?.portada,

imagen:
imagenGuardada,

video:
videoGuardado,

};

localStorage.setItem(

"historiasREADZONE",

JSON.stringify(
historias
)

);

},5000);

/* ==========================
VISTA PREVIA
========================== */

btnVistaPrevia.addEventListener("click", () => {

    const datosPreview = {
        titulo: titulo.value,
        contenido: contenido.innerHTML,
        portada: portadaHistoria.src,
        nombreHistoria: nombreHistoria.textContent
    };

    localStorage.setItem(
        "previewREADZONE",
        JSON.stringify(datosPreview)
    );

    window.open(
        "vista_previa.html",
        "_blank"
    );

});

/* ==========================
PUBLICAR
========================== */

btnPublicar
.addEventListener(
"click",
()=>{

guardarHistoria();

let historias =

JSON.parse(
localStorage.getItem(
"historiasREADZONE"
)
) || [];

if(
historias[idHistoria]
){

historias[idHistoria]
.publicada = true;

localStorage.setItem(

"historiasREADZONE",

JSON.stringify(
historias
)

);

}

alert(
"Historia publicada correctamente"
);

});

/* ==========================
SELECCIONAR Y BORRAR MEDIA
========================== */

editor.addEventListener(
"click",
function(e){

document
.querySelectorAll(
".bloque-media"
)
.forEach(
bloque=>{

bloque.classList.remove(
"activo"
);

}
);

const bloque =
e.target.closest(
".bloque-media"
);

if(bloque){

bloque.classList.add(
"activo"
);

}

});

editor.addEventListener(
"click",
function(e){

if(
e.target.classList.contains(
"btn-eliminar-media"
)
){

e.target
.closest(
".bloque-media"
)
.remove();

marcarSinGuardar();

}

});

/* ==========================
VOLVER A EDITAR CONTENIDO
========================== */

btnVolver.addEventListener(
"click",
()=>{

    localStorage.setItem(
        "historiaActualID",
        historias[idHistoria].id
    );

    window.location.href =
    "Editar_contenido.html";

});

/* ==========================
INICIO
========================== */

actualizarFecha();