const apiKeyTMDB = '8c9db7808806d5a5ac4e84a985077193';
const apiKeyOMDB = 'ab236a97';

let todasLasTarjetas = [];

// Cargar contenido al iniciar
window.onload = async () => {
  const resultadosDiv = document.getElementById('resultados');
  resultadosDiv.innerHTML = '<p>Cargando...</p>';

  const tmdbElements = document.querySelectorAll('#tmdbList [data-id]');
  const omdbElements = document.querySelectorAll('#omdbList [data-id]');

  let promises = [];

  tmdbElements.forEach(el => {
    const id = el.getAttribute('data-id');
    const type = el.getAttribute('data-type') || 'movie';
    promises.push(obtenerDatosTMDB(id, type));
  });

  omdbElements.forEach(el => {
    const id = el.getAttribute('data-id');
    const type = el.getAttribute('data-type') || 'movie';
    promises.push(obtenerDatosOMDB(id, type));
  });

  try {
    const resultados = await Promise.all(promises);
    todasLasTarjetas = resultados.filter(Boolean);
    mostrarResultados(todasLasTarjetas);
  } catch (error) {
    console.error("Error general:", error);
    resultadosDiv.innerHTML = '<p>Error al cargar los datos.</p>';
  }
};

// Obtener datos desde TMDB (español primero, inglés como fallback)
async function obtenerDatosTMDB(id, type = 'movie') {
  try {
    const endpoint = type === 'tv' ? 'tv' : 'movie';
    
    // Primero intentamos en español
    let url = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${apiKeyTMDB}&language=es`;
    let res = await fetch(url);
    let data = await res.json();

    // Verificamos si el título en español es diferente al original
    const tituloEspañol = data.title || data.name;
    const tituloOriginal = data.original_title || data.original_name;
    
    if (!tituloEspañol || tituloEspañol === tituloOriginal) {
      // Si no hay traducción válida, obtenemos datos en inglés
      url = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${apiKeyTMDB}&language=en`;
      res = await fetch(url);
      data = await res.json();
    }

    const titulo = data.title || data.name || 'Título no disponible';

    // Obtenemos actores en español si están disponibles
    const castUrl = `https://api.themoviedb.org/3/${endpoint}/${id}/credits?api_key=${apiKeyTMDB}&language=es`;
    const castRes = await fetch(castUrl);
    const castData = await castRes.json();
    const actores = castData.cast?.slice(0, 5).map(a => a.name).join(', ') || 'Desconocido';

    if (data.seasons) {
      return {
        tipo: 'serie',
        titulo: titulo,
        anio: data.first_air_date?.split('-')[0] || 'Desconocido',
        generos: data.genres?.map(g => g.name).join(', ') || 'Sin género',
        actores: actores,
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : 'https://via.placeholder.com/200x300?text=Sin+Imagen',
        temporadas: data.number_of_seasons,
        capitulos: data.number_of_episodes
      };
    } else {
      return {
        tipo: 'pelicula',
        titulo: titulo,
        anio: data.release_date?.split('-')[0] || 'Desconocido',
        generos: data.genres?.map(g => g.name).join(', ') || 'Sin género',
        actores: actores,
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : 'https://via.placeholder.com/200x300?text=Sin+Imagen'
      };
    }
  } catch (error) {
    console.error(`Error TMDB (ID: ${id})`, error);
    return null;
  }
}

// Obtener datos desde OMDB (usando HTTPS para compatibilidad con móviles)
async function obtenerDatosOMDB(id, type = 'movie') {
  try {
    // Cambiado a HTTPS para funcionar en móviles
    const res = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${apiKeyOMDB}`);
    const data = await res.json();

    if (data.Response === 'False') throw new Error("No se encontró contenido");

    if (type === "tv" || data.Type === "series") {
      return {
        tipo: 'serie',
        titulo: data.Title,
        anio: data.Year.split('–')[0],
        generos: data.Genre || 'Sin género',
        actores: data.Actors || 'Desconocido',
        poster: data.Poster !== "N/A" ? data.Poster : 'https://via.placeholder.com/200x300?text=Sin+Imagen',
        temporadas: data.totalSeasons || 'Desconocido',
        capitulos: 'N/A'
      };
    } else {
      return {
        tipo: 'pelicula',
        titulo: data.Title,
        anio: data.Year.split('–')[0],
        generos: data.Genre || 'Sin género',
        actores: data.Actors || 'Desconocido',
        poster: data.Poster !== "N/A" ? data.Poster : 'https://via.placeholder.com/200x300?text=Sin+Imagen'
      };
    }
  } catch (error) {
    console.error(`Error OMDB (ID: ${id})`, error);
    return null;
  }
}

// Mostrar tarjetas ordenadas por año
function mostrarResultados(pelisSeries) {
  const contenedor = document.getElementById('resultados');
  contenedor.innerHTML = '';

  if (pelisSeries.length === 0) {
    contenedor.innerHTML = '<p>No hay resultados.</p>';
    return;
  }

  pelisSeries.sort((a, b) => {
    const anioA = parseInt(a.anio);
    const anioB = parseInt(b.anio);
    return isNaN(anioB) || isNaN(anioA) ? 0 : anioB - anioA;
  });

  pelisSeries.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';

    let htmlContent = `
      <img src="${item.poster}" alt="${item.titulo}" loading="lazy">
      <h3>${item.titulo}</h3>
      <p><strong>Género:</strong> ${item.generos}</p>
      <p><strong>Año:</strong> ${item.anio}</p>
    `;

    if (item.tipo === 'serie') {
      htmlContent += `
        <div class="info-serie">
          <span><strong>Temp:</strong> ${item.temporadas}</span>
          <span><strong>Cap:</strong> ${item.capitulos}</span>
        </div>
      `;
    }

    card.innerHTML = htmlContent;
    contenedor.appendChild(card);
  });
}

// Filtrar resultados
function filtrarResultados() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!query) {
    mostrarResultados(todasLasTarjetas);
    return;
  }

  const filtradas = todasLasTarjetas.filter(item => {
    const textoCompleto = `
      ${item.titulo} 
      ${item.generos} 
      ${item.anio} 
      ${item.actores}
    `.toLowerCase();
    return textoCompleto.includes(query);
  });

  mostrarResultados(filtradas);
}