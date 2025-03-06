document.getElementById('searchButton').addEventListener('click', searchGames);

async function searchGames() {
    const query = document.getElementById('searchInput').value;
    if (!query) return;

    try {
        const response = await fetch(`https://nonchalant-marmalade-learning.glitch.me/games?query=${encodeURIComponent(query)}`);
        const games = await response.json();

        displayGames(games);
    } catch (error) {
        console.error('Error fetching games:', error);
        alert('Ocurrió un error al buscar juegos.');
    }
}

function displayGames(games) {
    const container = document.getElementById('gamesContainer');
    container.innerHTML = '';

    games.forEach(game => {
        const card = document.createElement('div');
        card.classList.add('game-card');

        const title = document.createElement('h2');
        title.textContent = game.name || 'Sin título';

        const cover = document.createElement('img');
        cover.src = game.cover ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : 'placeholder.jpg';
        cover.alt = game.name || 'Portada del juego';

        const genres = document.createElement('p');
        genres.textContent = `Géneros: ${game.genres?.map(genre => genre.name).join(', ') || 'No disponible'}`;

        const platforms = document.createElement('p');
        platforms.textContent = `Plataformas: ${game.platforms?.map(platform => platform.name).join(', ') || 'No disponible'}`;

        card.appendChild(cover);
        card.appendChild(title);
        card.appendChild(genres);
        card.appendChild(platforms);

        container.appendChild(card);
    });
}