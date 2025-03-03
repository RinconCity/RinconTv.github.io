 function limitarPalabras(detalle) {
            if (!detalle) return 'No especificado';
            const palabras = detalle.split(' ').slice(0, 10); // Tomar las primeras 10 palabras
            return palabras.join(' ') + (detalle.split(' ').length > 10 ? '...' : '');
        }

        // Obtener todos los contenedores
        document.querySelectorAll('.contenedor').forEach(contenedor => {
            const boton = contenedor.querySelector('.btn-requisitos');
            const ventanaEmergente = contenedor.querySelector('.ventana-emergente');
            const cerrarVentana = ventanaEmergente.querySelector('.cerrar');
            const requisitosContainer = ventanaEmergente.querySelector('.requisitos');
            const carrusel = ventanaEmergente.querySelector('.carrusel');
            const gameId = contenedor.getAttribute('data-game-id'); // ID del juego

            // Mostrar la ventana emergente al hacer clic en el botón
            boton.addEventListener('click', async () => {
                try {
                    // Limpiar los contenedores antes de cargar nuevos datos
                    requisitosContainer.innerHTML = '';
                    carrusel.innerHTML = '';

                    // Obtener datos de los requisitos mínimos del juego (PC)
                    const apiKey = '8b5b667ac481455cbdf591f778f1c594';
                    const gameResponse = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
                    const gameData = await gameResponse.json();

                    // Filtrar los requisitos mínimos para PC
                    const pcRequirements = gameData.platforms.find(platform => platform.platform.name === 'PC')?.requirements;
                    if (pcRequirements && pcRequirements.minimum) {
                        // Extraer los campos específicos: OS, Processor, Storage, Memory, Graphics
                        const requisitosTexto = pcRequirements.minimum;
                        const requisitosFiltrados = {};

                        // Mapear los nombres largos a abreviaturas más cortas
                        const camposResumidos = {
                            'OS': 'OS',
                            'Processor': 'Proc',
                            'Storage': 'Alm',
                            'Memory': 'Mem',
                            'Graphics': 'GPU'
                        };

                        // Buscar cada campo en el texto de los requisitos
                        Object.keys(camposResumidos).forEach(campo => {
                            const regex = new RegExp(`${campo}:\\s*([^\n]+)`, 'i');
                            const match = requisitosTexto.match(regex);
                            if (match) {
                                requisitosFiltrados[camposResumidos[campo]] = limitarPalabras(match[1].trim());
                            } else {
                                requisitosFiltrados[camposResumidos[campo]] = 'No especificado';
                            }
                        });

                        // Mostrar los requisitos filtrados
                        requisitosContainer.innerHTML = `
                            <h3>Requisitos Mínimos (PC):</h3>
                            <ul>
                                ${Object.entries(requisitosFiltrados).map(([nombre, valor]) => `
                                    <li><strong>${nombre}:</strong> ${valor}</li>
                                `).join('')}
                            </ul>
                        `;
                    } else {
                        requisitosContainer.innerHTML = '<p>No hay requisitos mínimos disponibles para PC.</p>';
                    }

                    // Obtener datos de capturas de pantalla de la API de RAWG
                    const screenshotsResponse = await fetch(`https://api.rawg.io/api/games/${gameId}/screenshots?key=${apiKey}`);
                    const screenshotsData = await screenshotsResponse.json();

                    // Mostrar máximo 8 imágenes en el carrusel
                    const imagenes = screenshotsData.results.slice(0, 8);
                    if (imagenes.length > 0) {
                        imagenes.forEach(imagen => {
                            const imgElement = document.createElement('img');
                            imgElement.src = imagen.image;
                            imgElement.alt = `Captura de pantalla del juego`;
                            carrusel.appendChild(imgElement);
                        });
                    } else {
                        carrusel.innerHTML = '<p>No hay imágenes disponibles para este juego.</p>';
                    }

                    // Mostrar la ventana emergente
                    ventanaEmergente.style.display = 'block';
                } catch (error) {
                    console.error('Error al cargar los datos:', error);
                    requisitosContainer.innerHTML = '<p>Error al cargar los requisitos.</p>';
                    carrusel.innerHTML = '<p>Error al cargar las imágenes.</p>';
                }
            });

            // Cerrar la ventana emergente al hacer clic en el botón de cierre
            cerrarVentana.addEventListener('click', () => {
                ventanaEmergente.style.display = 'none';
            });

            // Cerrar la ventana emergente si se hace clic fuera de ella
            ventanaEmergente.addEventListener('click', (event) => {
                if (event.target === ventanaEmergente) {
                    ventanaEmergente.style.display = 'none';
                }
            });
        });