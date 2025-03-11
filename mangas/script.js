const apiKey = "8c9db7808806d5a5ac4e84a985077193";
const movieContainer = document.getElementById("movieContainer");
const searchInput = document.getElementById("searchInput");
const detailModal = document.getElementById("detailModal");
const modalContent = document.querySelector(".modal-content");
const closeModalButton = document.querySelector(".close");

// Función para cargar trailers de TMDB
async function fetchTrailers(id, type) {
    const url = `https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results.find((video) => video.type === "Trailer" && video.site === "YouTube");
}

// Función para cargar datos de TMDB (incluyendo créditos)
async function fetchData(id, type) {
    const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=es-ES`;
    const creditsUrl = `https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${apiKey}`;

    // Obtener datos principales y créditos simultáneamente
    const [dataResponse, creditsResponse] = await Promise.all([fetch(url), fetch(creditsUrl)]);
    const data = await dataResponse.json();
    const creditsData = await creditsResponse.json();

    // Agregar los actores al objeto de datos
    data.cast = creditsData.cast.map((actor) => actor.name);

    return data;
}

// Función para renderizar tarjetas
function renderCard(data, type) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.id = data.id;
    card.dataset.type = type;

    // Almacenar los datos completos en un atributo personalizado
    card.dataset.fullInfo = JSON.stringify(data);

    const image = document.createElement("img");
    image.src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
    image.alt = data.title || data.name;

    const playIcon = document.createElement("div");
    playIcon.classList.add("play-icon");
    playIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    playIcon.style.display = "none"; // Ocultar por defecto

    const info = document.createElement("div");
    info.classList.add("info");

    const title = document.createElement("h3");
    title.textContent = data.title || data.name;

    const originalTitle = document.createElement("p");
    originalTitle.textContent = `Título Original: ${data.original_title || data.original_name}`;

    info.appendChild(title);
    info.appendChild(originalTitle);

    if (type === "tv") {
        const seasonsEpisodes = document.createElement("p");
        seasonsEpisodes.textContent = `Temp: ${data.number_of_seasons} | Cap: ${data.number_of_episodes}`;
        info.appendChild(seasonsEpisodes);
    }

    card.appendChild(image);
    card.appendChild(playIcon); // Agregar el ícono de Play
    card.appendChild(info);

    // Cargar trailer y mostrar el ícono de Play si está disponible
    fetchTrailers(data.id, type).then((trailer) => {
        if (trailer) {
            playIcon.style.display = "flex"; // Mostrar el ícono de Play
            playIcon.addEventListener("click", (e) => {
                e.stopPropagation(); // Evitar que se abra el modal
                openTrailerModal(trailer.key); // Abrir el modal del tráiler
            });
        }
    });

    // Abrir modal al hacer clic
    card.addEventListener("click", () => openModal(data, type));

    return card;
}

// Función para abrir el modal del tráiler
function openTrailerModal(videoKey) {
    const trailerModal = document.getElementById("trailerModal");
    const trailerIframe = document.getElementById("trailerIframe");

    // Configurar el iframe con el video de YouTube
    trailerIframe.src = `https://www.youtube.com/embed/${videoKey}?autoplay=1`;

    // Mostrar el modal
    trailerModal.style.display = "block";
}

// Función para cerrar el modal del tráiler
document.querySelector("#trailerModal .close").addEventListener("click", () => {
    const trailerModal = document.getElementById("trailerModal");
    const trailerIframe = document.getElementById("trailerIframe");

    // Detener el video y ocultar el modal
    trailerIframe.src = ""; // Limpiar el iframe
    trailerModal.style.display = "none";
});

// Cerrar el modal haciendo clic fuera de él
window.addEventListener("click", (event) => {
    const trailerModal = document.getElementById("trailerModal");
    if (event.target === trailerModal) {
        const trailerIframe = document.getElementById("trailerIframe");
        trailerIframe.src = ""; // Limpiar el iframe
        trailerModal.style.display = "none";
    }
});

// Cargar todas las tarjetas iniciales
document.querySelectorAll("#movieContainer > div").forEach(async (item) => {
    const id = item.dataset.id;
    const type = item.dataset.type;
    const data = await fetchData(id, type);
    const card = renderCard(data, type);
    item.replaceWith(card);
});

// Función para cargar todas las tarjetas iniciales y ordenarlas por fecha
async function loadAndSortCards() {
    const items = Array.from(document.querySelectorAll("#movieContainer > div"));

    // Obtener datos completos para cada tarjeta
    const cardsWithData = await Promise.all(
        items.map(async (item) => {
            const id = item.dataset.id;
            const type = item.dataset.type;
            const data = await fetchData(id, type);
            return { data, type };
        })
    );

    // Ordenar las tarjetas por fecha (de más reciente a más antigua)
    cardsWithData.sort((a, b) => {
        const dateA = a.data.release_date || a.data.first_air_date || "0000-00-00";
        const dateB = b.data.release_date || b.data.first_air_date || "0000-00-00";
        return new Date(dateB) - new Date(dateA); // Orden descendente
    });

    // Limpiar el contenedor antes de agregar las tarjetas ordenadas
    movieContainer.innerHTML = "";

    // Renderizar las tarjetas en el nuevo orden
    cardsWithData.forEach(({ data, type }) => {
        const card = renderCard(data, type);
        movieContainer.appendChild(card);
    });
}

// Llamar a la función para cargar y ordenar las tarjetas al iniciar
loadAndSortCards();

// Función de búsqueda modificada para mantener el orden
document.getElementById("searchInput").addEventListener("input", () => {
    const query = document.getElementById("searchInput").value.toLowerCase();

    // Obtener todas las tarjetas existentes
    const allCards = Array.from(document.querySelectorAll("#movieContainer > div"));

    allCards.forEach((card) => {
        const fullInfo = JSON.parse(card.dataset.fullInfo);

        // Extraer datos relevantes
        const spanishTitle = (fullInfo.title || fullInfo.name || "").toLowerCase();
        const originalTitle = (fullInfo.original_title || fullInfo.original_name || "").toLowerCase();
        const genres = fullInfo.genres?.map((genre) => genre.name.toLowerCase()) || [];
        const year = fullInfo.release_date
            ? new Date(fullInfo.release_date).getFullYear()
            : fullInfo.first_air_date
            ? new Date(fullInfo.first_air_date).getFullYear()
            : null;

        // Extraer nombres de actores
        const actors = fullInfo.cast?.map((actor) => actor.toLowerCase()) || [];

        // Verificar si coincide con el título en español, título original, género, año o actores
        const matchesSpanishTitle = spanishTitle.includes(query);
        const matchesOriginalTitle = originalTitle.includes(query);
        const matchesGenre = genres.some((genre) => genre.includes(query));
        const matchesYear = year && year.toString().includes(query);
        const matchesActor = actors.some((actor) => actor.includes(query));

        // Mostrar u ocultar la tarjeta según el filtro
        card.style.display =
            matchesSpanishTitle || matchesOriginalTitle || matchesGenre || matchesYear || matchesActor
                ? "block"
                : "none";
    });
});

// Función para abrir el modal de detalles
function openModal(data, type) {
    // Asignar valores básicos
    document.getElementById("modalTitle").textContent = data.title || data.name;
    document.getElementById("modalImage").src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
    document.getElementById("modalOriginalTitle").textContent = data.original_title || data.original_name;
    document.getElementById("modalSpanishTitle").textContent = data.title || data.name;
    document.getElementById("modalOverview").textContent = data.overview || "Sin sinopsis disponible.";
    document.getElementById("modalReleaseYear").textContent = data.release_date
        ? new Date(data.release_date).getFullYear()
        : data.first_air_date
        ? new Date(data.first_air_date).getFullYear()
        : "Desconocido";

    // Mostrar géneros
    const genres = data.genres ? data.genres.map((genre) => genre.name).join(", ") : "Desconocido";
    document.getElementById("modalGenres").textContent = genres;

    // Mostrar temporadas y episodios si es una serie
    const seasonsEpisodes = document.getElementById("modalSeasonsEpisodes");
    if (type === "tv") {
        seasonsEpisodes.textContent = `Temporadas: ${data.number_of_seasons} | Capítulos: ${data.number_of_episodes}`;
    } else {
        seasonsEpisodes.textContent = "";
    }

    // Cargar referencias
    loadReferences(data);

    // Obtener el elenco
    const castContainer = document.getElementById("modalCast");
    castContainer.innerHTML = ""; // Limpiar el contenedor antes de cargar nuevos datos

    fetch(`https://api.themoviedb.org/3/${type}/${data.id}/credits?api_key=${apiKey}`)
        .then((response) => response.json())
        .then((creditsData) => {
            const cast = creditsData.cast.slice(0, 10); // Mostrar solo los primeros 10 actores
            cast.forEach((actor) => {
                // Crear la tarjeta del actor
                const actorCard = document.createElement("div");
                actorCard.classList.add("actor-card");

                // Imagen del actor
                const actorImage = document.createElement("img");
                actorImage.src = actor.profile_path
                    ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                    : "https://via.placeholder.com/120x160?text=No+Image"; // Imagen por defecto si no hay foto
                actorImage.alt = actor.name;

                // Nombre del actor
                const actorName = document.createElement("p");
                actorName.textContent = actor.name;

                // Agregar elementos a la tarjeta
                actorCard.appendChild(actorImage);
                actorCard.appendChild(actorName);

                // Agregar la tarjeta al contenedor
                castContainer.appendChild(actorCard);
            });
        })
        .catch((error) => {
            console.error("Error al cargar el elenco:", error);
            castContainer.innerHTML = "<p>No se pudo cargar el elenco.</p>";
        });

    // Mostrar el modal de detalles
    const detailModal = document.getElementById("detailModal");
    detailModal.style.display = "block";

    // Agregar evento de cierre al ícono flotante
    const closeIcon = document.querySelector("#detailModal .close-icon");
    closeIcon.onclick = () => {
        detailModal.style.display = "none";
    };

    // Agregar evento de cierre al hacer clic fuera del modal
    window.onclick = (event) => {
        if (event.target === detailModal) {
            detailModal.style.display = "none";
        }
    };
}

// Función para cargar referencias basadas en el género
function loadReferences(currentData) {
    const referencesGrid = document.getElementById("referencesGrid");
    referencesGrid.innerHTML = ""; // Limpiar referencias anteriores

    // Obtener todas las tarjetas existentes
    const allCards = Array.from(document.querySelectorAll("#movieContainer > div"));

    // Filtrar tarjetas que coincidan con el género
    const filteredCards = allCards.filter((card) => {
        const fullInfo = JSON.parse(card.dataset.fullInfo);

        // Verificar si hay al menos un género en común
        return currentData.genres?.some((genre) =>
            fullInfo.genres?.map((g) => g.name).includes(genre.name)
        );
    });

    if (filteredCards.length === 0) {
        // Mostrar un mensaje si no hay referencias disponibles
        referencesGrid.innerHTML = "<p>No hay referencias disponibles.</p>";
        return;
    }

    // Mostrar hasta 8 referencias
    filteredCards.slice(0, 10).forEach((card) => {
        const fullInfo = JSON.parse(card.dataset.fullInfo);

        const referenceCard = document.createElement("div");
        referenceCard.classList.add("reference-card");

        const image = document.createElement("img");
        image.src = `https://image.tmdb.org/t/p/w500${fullInfo.poster_path}`;
        image.alt = fullInfo.title || fullInfo.name;

        const title = document.createElement("p");
        title.textContent = fullInfo.title || fullInfo.name;

        referenceCard.appendChild(image);
        referenceCard.appendChild(title);

        // Hacer la referencia funcional
        referenceCard.addEventListener("click", () => {
            openModal(fullInfo, card.dataset.type); // Abrir el modal con los datos de la referencia
        });

        referencesGrid.appendChild(referenceCard);
    });
}