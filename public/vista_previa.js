const datos = JSON.parse(
    localStorage.getItem(
        "previewREADZONE"
    )
);

if(datos){

    document.getElementById(
        "tituloHistoria"
    ).textContent =
    datos.titulo;

    document.getElementById(
        "contenidoHistoria"
    ).innerHTML =
    datos.contenido;

    document.getElementById(
        "portadaHistoria"
    ).src =
    datos.portada;

    document.getElementById(
        "nombreHistoria"
    ).textContent =
    datos.nombreHistoria;

}