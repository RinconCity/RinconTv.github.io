const apiKey = 'Bearer 5z6wekiks41602c76i45e9d29b436i'; // Reemplaza con tu clave de API de IGDB
const proxyUrl = 'https://mirror-sunset-burst.glitch.me/igdb'; // Usa la URL de tu proxy en Glitch
const juegosContainer = document.getElementById('juegos-container');

async function obtenerJuegoPorId(id) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(`fields name,genres.name,cover.url,summary,platforms.name; where id = ${id};`)
    };

    try {
        const response = await fetch(proxyUrl, options);
        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error('Error al obtener el juego:', error);
    }
}

function crearElementoJuego(juego) {
    const juegoDiv = document.createElement('div');
    juegoDiv.classList.add('juego');

    const imagen = document.createElement('img');
    imagen.src = `https:${juego.cover.url.replace('t_thumb', 't_cover_big')}`;
    juegoDiv.appendChild(imagen);

    const titulo = document.createElement('h2');
    titulo.textContent = juego.name;
    juegoDiv.appendChild(titulo);

    const genero = document.createElement('p');
    genero.textContent = `Género: ${juego.genres.map(g => g.name).join(', ')}`;
    juegoDiv.appendChild(genero);

    const plataformas = document.createElement('p');
    plataformas.textContent = `Plataformas: ${juego.platforms.map(p => p.name).join(', ')}`;
    juegoDiv.appendChild(plataformas);

    const requisitos = document.createElement('p');
    requisitos.textContent = `Requisitos: ${juego.summary || 'No disponible'}`;
    juegoDiv.appendChild(requisitos);

    return juegoDiv;
}

async function agregarJuego() {
    const gameId = document.getElementById('gameId').value;
    if (!gameId) return;

    const juego = await obtenerJuegoPorId(gameId);
    if (juego) {
        const juegoElemento = crearElementoJuego(juego);
        juegosContainer.appendChild(juegoElemento);
    } else {
        alert('Juego no encontrado');
    }
}