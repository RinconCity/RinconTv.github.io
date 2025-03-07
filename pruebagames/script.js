document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const gameList = document.getElementById('gameList');

    // Función para buscar juegos
    const fetchGames = async (query) => {
        try {
            const response = await fetch(`https://cumbersome-wonderful-angora.glitch.me/games?name=${encodeURIComponent(query)}`);
            const games = await response.json();

            // Limpiar la lista actual
            gameList.innerHTML = '';

            // Mostrar los juegos en tarjetas
            games.forEach(game => {
                const card = document.createElement('div');
                card.classList.add('card');

                const coverUrl = game.cover ? game.cover.url.replace('t_thumb', 't_cover_big') : 'https://via.placeholder.com/300';
                const platforms = game.platforms ? game.platforms.map(p => p.name).join(', ') : 'N/A';
                const releaseDate = game.release_dates ? game.release_dates[0]?.human : 'N/A';

                card.innerHTML = `
                    <img src="${coverUrl}" alt="${game.name}">
                    <div class="card-content">
                        <h2>${game.name}</h2>
                        <p><strong>Plataformas:</strong> ${platforms}</p>
                        <p><strong>Lanzamiento:</strong> ${releaseDate}</p>
                        <p><strong>Géneros:</strong> ${game.genres ? game.genres.map(g => g.name).join(', ') : 'N/A'}</p>
                        <p>${game.summary || 'Sin descripción'}</p>
                    </div>
                `;

                gameList.appendChild(card);
            });
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    };

    // Buscar juegos cuando el usuario escribe
    searchInput.addEventListener('input', (event) => {
        const query = event.target.value.trim();
        if (query.length > 2) {
            fetchGames(query);
        } else {
            gameList.innerHTML = '';
        }
    });
});