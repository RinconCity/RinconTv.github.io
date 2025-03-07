document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const gameList = document.getElementById('gameList');

    // Proxy URL (reemplaza con tu URL de Glitch)
    const PROXY_URL = 'https://brainy-delicate-pelican.glitch.me/games';

    // Función para cargar juegos desde el backend
    const loadGames = async (query = '') => {
        try {
            const response = await fetch(`${PROXY_URL}?query=${encodeURIComponent(query)}`);
            const games = await response.json();

            // Limpiar lista de juegos
            gameList.innerHTML = '';

            // Mostrar juegos en cards
            games.forEach(game => {
                const card = document.createElement('div');
                card.classList.add('card');

                const coverUrl = game.cover?.url ? game.cover.url.replace('t_thumb', 't_cover_big') : 'https://via.placeholder.com/250';
                const genres = game.genres?.map(genre => genre.name).join(', ') || 'Género no disponible';
                const requirements = game.minimum_requirements || 'Requisitos no disponibles';

                card.innerHTML = `
                    <img src="${coverUrl}" alt="${game.name}">
                    <h2>${game.name}</h2>
                    <p><strong>Género:</strong> ${genres}</p>
                    <p><strong>Requisitos:</strong> ${requirements}</p>
                `;

                gameList.appendChild(card);
            });
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    };

    // Cargar juegos iniciales
    loadGames();

    // Filtro de búsqueda en tiempo real
    searchInput.addEventListener('input', (event) => {
        const query = event.target.value.trim();
        loadGames(query);
    });
});