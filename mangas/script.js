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

    if (todasLasTarjetas.length === 0) {
      resultadosDiv.innerHTML = '<p>No hay resultados.</p>';
    } else {
      mostrarResultados(todasLasTarjetas);
    }
  } catch (error) {
    console.error("Error general:", error);
    resultadosDiv.innerHTML = '<p>Error al cargar los datos. Revisa la consola.</p>';
  }
};

// Obtener datos desde TMDB con prioridad a títulos en Romaji
async function obtenerDatosTMDB(id, type = 'movie') {
  try {
    const endpoint = type === 'tv' ? 'tv' : 'movie';
    
    // Obtenemos los datos en japonés para el título original
    const urlJa = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${apiKeyTMDB}&language=ja`;
    const resJa = await fetch(urlJa);
    
    if (!resJa.ok) throw new Error(`Error en TMDB (JA): ${resJa.status}`);
    
    const dataJa = await resJa.json();
    const tituloOriginal = dataJa.original_title || dataJa.original_name;
    
    // Obtenemos los datos en inglés como alternativa
    const urlEn = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${apiKeyTMDB}&language=en`;
    const resEn = await fetch(urlEn);
    const dataEn = await resEn.json();
    const tituloEn = dataEn.title || dataEn.name;
    
    // Obtenemos los datos en español para el resto de la información
    const urlEs = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${apiKeyTMDB}&language=es`;
    const resEs = await fetch(urlEs);

    if (!resEs.ok) throw new Error(`Error en TMDB (ES): ${resEs.status}`);

    const dataEs = await resEs.json();

    if (!dataEs.title && !dataEs.name) throw new Error("No se encontró contenido");

    // Obtenemos actores
    const castRes = await fetch(`https://api.themoviedb.org/3/${endpoint}/${id}/credits?api_key=${apiKeyTMDB}&language=es`);
    const castData = await castRes.json();
    const actores = castData.cast?.slice(0, 5).map(a => a.name).join(', ') || 'Desconocido';

    // Determinamos el título a mostrar (priorizando Romaji)
    let tituloAMostrar;
    
    if (tituloOriginal && esRomaji(tituloOriginal)) {
      tituloAMostrar = tituloOriginal;
    } 
    else if (tituloEn) {
      tituloAMostrar = tituloEn;
    }
    else {
      tituloAMostrar = dataEs.title || dataEs.name;
    }

    if (dataEs.seasons) {
      return {
        tipo: 'serie',
        titulo: tituloAMostrar,
        anio: dataEs.first_air_date ? dataEs.first_air_date.split('-')[0] : 'Desconocido',
        generos: dataEs.genres.map(g => g.name).join(', ') || 'Sin género',
        actores,
        overview: dataEs.overview || '',
        poster: dataEs.poster_path ? `https://image.tmdb.org/t/p/w500${dataEs.poster_path}` : 'https://via.placeholder.com/200x300?text=Sin+Imagen',
        temporadas: dataEs.number_of_seasons,
        capitulos: dataEs.number_of_episodes,
        fuente: 'tmdb'
      };
    } else {
      return {
        tipo: 'pelicula',
        titulo: tituloAMostrar,
        anio: dataEs.release_date ? dataEs.release_date.split('-')[0] : 'Desconocido',
        generos: dataEs.genres.map(g => g.name).join(', ') || 'Sin género',
        actores,
        overview: dataEs.overview || '',
        poster: dataEs.poster_path ? `https://image.tmdb.org/t/p/w500${dataEs.poster_path}` : 'https://via.placeholder.com/200x300?text=Sin+Imagen',
        fuente: 'tmdb'
      };
    }

  } catch (error) {
    console.error(`Error TMDB (ID: ${id})`, error);
    return null;
  }
}

// Obtener datos desde OMDB asegurando títulos en Romaji
async function obtenerDatosOMDB(id, type = 'movie') {
  try {
    // Usamos protocolo HTTPS para evitar bloqueos en móviles
    const url = `https://www.omdbapi.com/?i=${id}&apikey=${apiKeyOMDB}`;
    
    // Implementamos un timeout para evitar esperas infinitas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const data = await res.json();

    if (data.Response === 'False') {
      // Si falla OMDB, intentamos obtener los datos de TMDB como respaldo
      console.log(`OMDB falló para ID ${id}, intentando con TMDB...`);
      return await obtenerDatosTMDB(id, type);
    }

    // Función para asegurar que el título esté en Romaji
    const asegurarRomaji = (titulo) => {
      // Si el título ya está en caracteres latinos, lo dejamos igual
      if (/^[a-zA-Z0-9\s\-.,:;'"!?]+$/.test(titulo)) {
        return titulo;
      }
      // Si no, intentamos obtener el título en inglés desde TMDB
      return obtenerTituloAlternativo(id, type);
    };

    const tituloRomaji = await asegurarRomaji(data.Title);

    if (type === "tv" || data.Type === "series") {
      let totalCapitulos = 0;
      const totalTemporadas = parseInt(data.totalSeasons) || 0;

      // Limitamos a 3 temporadas máximo para no hacer demasiadas peticiones
      const temporadasAConsultar = Math.min(totalTemporadas, 3);
      
      for (let i = 1; i <= temporadasAConsultar; i++) {
        try {
          const seasonUrl = `https://www.omdbapi.com/?i=${id}&season=${i}&apikey=${apiKeyOMDB}`;
          const seasonRes = await fetch(seasonUrl, {
            signal: controller.signal
          });
          const seasonData = await seasonRes.json();
          if (seasonData.Episodes && Array.isArray(seasonData.Episodes)) {
            totalCapitulos += seasonData.Episodes.length;
          }
        } catch (error) {
          console.error(`Error al obtener temporada ${i}`, error);
        }
      }

      // Si no consultamos todas las temporadas, estimamos los capítulos
      if (temporadasAConsultar < totalTemporadas) {
        const promedioPorTemp = totalCapitulos / temporadasAConsultar;
        totalCapitulos = Math.round(promedioPorTemp * totalTemporadas);
      }

      return {
        tipo: 'serie',
        titulo: tituloRomaji,
        anio: data.Year.split('–')[0],
        generos: data.Genre || 'Sin género',
        actores: data.Actors || 'Desconocido',
        overview: data.Plot || '',
        poster: data.Poster !== "N/A" ? data.Poster.replace('http://', 'https://') : 'https://via.placeholder.com/200x300?text=Sin+Imagen',
        temporadas: data.totalSeasons || 'Desconocido',
        capitulos: totalCapitulos || 'Desconocido',
        fuente: 'omdb'
      };

    } else {
      return {
        tipo: 'pelicula',
        titulo: tituloRomaji,
        anio: data.Year.split('–')[0],
        generos: data.Genre || 'Sin género',
        actores: data.Actors || 'Desconocido',
        overview: data.Plot || '',
        poster: data.Poster !== "N/A" ? data.Poster.replace('http://', 'https://') : 'https://via.placeholder.com/200x300?text=Sin+Imagen',
        fuente: 'omdb'
      };
    }

  } catch (error) {
    console.error(`Error OMDB (ID: ${id})`, error);
    // Si falla OMDB, intentamos obtener los datos de TMDB como respaldo
    return await obtenerDatosTMDB(id, type);
  }
}

// Función auxiliar para obtener título alternativo desde TMDB
async function obtenerTituloAlternativo(id, type) {
  try {
    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const url = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${apiKeyTMDB}&language=en`;
    const res = await fetch(url);
    const data = await res.json();
    return data.title || data.name || 'Título no disponible';
  } catch (error) {
    console.error('Error al obtener título alternativo:', error);
    return 'Título no disponible';
  }
}

// Función para detectar si un texto está en Romaji (alfabeto latino)
function esRomaji(texto) {
  return /^[a-zA-Z0-9\s\-.,:;'"!?]+$/.test(texto);
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

    // Aseguramos que el poster use HTTPS
    let posterUrl = item.poster;
    if (posterUrl && posterUrl.startsWith('http://')) {
      posterUrl = posterUrl.replace('http://', 'https://');
    }

    let htmlContent = `
      <img src="${posterUrl || 'https://via.placeholder.com/200x300?text=Sin+Imagen'}" 
           alt="${item.titulo}" 
           onerror="this.src='https://via.placeholder.com/200x300?text=Sin+Imagen'">
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

// Filtrar resultados desde datos completos de la API
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
      ${item.overview}
    `.toLowerCase();
    return textoCompleto.includes(query);
  });

  mostrarResultados(filtradas);
}