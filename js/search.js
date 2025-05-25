// Configuração da busca
const searchConfig = {
    minChars: 2,
    maxResults: 10,
    searchDelay: 300
};

// Cache de resultados
let searchCache = new Map();

// Elementos DOM
const searchInput = document.querySelector('#searchInput');
const searchResults = document.querySelector('#searchResults');
const searchFilters = document.querySelector('#searchFilters');

// Filtros disponíveis
const filters = {
    type: ['Filmes', 'Séries', 'Animes', 'Documentários'],
    genre: ['Ação', 'Comédia', 'Drama', 'Terror', 'Animação'],
    quality: ['HD', 'FullHD', '4K'],
    year: ['2024', '2023', '2022', '2021', '2020']
};

// Inicializar filtros
function initializeFilters() {
    Object.entries(filters).forEach(([filterType, options]) => {
        const filterGroup = document.createElement('div');
        filterGroup.className = 'filter-group mb-3';
        filterGroup.innerHTML = `
            <h6 class="text-light">${filterType.charAt(0).toUpperCase() + filterType.slice(1)}</h6>
            <div class="btn-group-sm">
                ${options.map(option => `
                    <button class="btn btn-outline-light me-2 mb-2" 
                            data-filter="${filterType}" 
                            data-value="${option}">
                        ${option}
                    </button>
                `).join('')}
            </div>
        `;
        searchFilters.appendChild(filterGroup);
    });
}

// Função de busca
async function performSearch(query, activeFilters = {}) {
    if (query.length < searchConfig.minChars) {
        hideResults();
        return;
    }

    const cacheKey = JSON.stringify({ query, activeFilters });
    if (searchCache.has(cacheKey)) {
        showResults(searchCache.get(cacheKey));
        return;
    }

    try {
        // Simular chamada à API
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&filters=${JSON.stringify(activeFilters)}`);
        const results = await response.json();
        
        searchCache.set(cacheKey, results);
        showResults(results);
    } catch (error) {
        console.error('Erro na busca:', error);
        showError('Ocorreu um erro na busca. Tente novamente.');
    }
}

// Exibir resultados
function showResults(results) {
    if (!results.length) {
        searchResults.innerHTML = '<p class="text-muted">Nenhum resultado encontrado</p>';
        return;
    }

    searchResults.innerHTML = `
        <div class="list-group">
            ${results.map(item => `
                <a href="${item.url}" class="list-group-item list-group-item-action bg-secondary text-light">
                    <div class="d-flex">
                        <img src="${item.thumbnail}" class="me-3" style="width: 50px; height: 70px; object-fit: cover;">
                        <div>
                            <h6 class="mb-1">${item.title}</h6>
                            <p class="mb-1 small">${item.year} • ${item.type} • ${item.quality}</p>
                            <small class="text-muted">${item.description}</small>
                        </div>
                    </div>
                </a>
            `).join('')}
        </div>
    `;
}

// Esconder resultados
function hideResults() {
    searchResults.innerHTML = '';
}

// Mostrar erro
function showError(message) {
    searchResults.innerHTML = `<p class="text-danger">${message}</p>`;
}

// Event Listeners
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        const activeFilters = getActiveFilters();
        performSearch(query, activeFilters);
    }, searchConfig.searchDelay);
});

searchFilters.addEventListener('click', (e) => {
    if (e.target.matches('[data-filter]')) {
        e.target.classList.toggle('active');
        const query = searchInput.value.trim();
        const activeFilters = getActiveFilters();
        performSearch(query, activeFilters);
    }
});

// Obter filtros ativos
function getActiveFilters() {
    const activeFilters = {};
    document.querySelectorAll('[data-filter].active').forEach(filter => {
        const type = filter.dataset.filter;
        const value = filter.dataset.value;
        if (!activeFilters[type]) {
            activeFilters[type] = [];
        }
        activeFilters[type].push(value);
    });
    return activeFilters;
}

// Sugestões de busca
function showSuggestions(query) {
    if (query.length < 2) return;

    const suggestions = [
        'Filmes de ação 2024',
        'Melhores séries de drama',
        'Filmes premiados',
        'Lançamentos de terror',
        'Séries populares'
    ].filter(s => s.toLowerCase().includes(query.toLowerCase()));

    if (suggestions.length) {
        const suggestionsList = document.createElement('div');
        suggestionsList.className = 'list-group mt-2';
        suggestionsList.innerHTML = suggestions.map(s => `
            <button class="list-group-item list-group-item-action bg-secondary text-light">
                <i class="fas fa-search me-2"></i>${s}
            </button>
        `).join('');
        searchResults.appendChild(suggestionsList);
    }
}

// Inicializar a busca
document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
}); 