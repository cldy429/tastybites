import { RecipeCard } from '../components/RecipeCard.js';
import { formatCategory, getQueryParam, sortRecipes } from '../utils/helpers.js';

export async function initRecipesPage(recipeService) {
    const recipesList = document.getElementById('recipesList');
    if (!recipesList) return;

    const recipes = await recipeService.getRecipes();
    const searchTerm = getQueryParam('search')?.toLowerCase()||"";
    const categoryFilter = getQueryParam('category');
    const favoritesOnly = getQueryParam('favorites') === '1';
    const categoryButtons = Array.from(document.querySelectorAll('.filter-btn'));
    const sortSelect = document.getElementById('sortSelect');
    const searchInputs = Array.from(document.querySelectorAll('[data-search-input]'));
    const resultCount = document.getElementById('recipeResultCount');
    const paginationWrap = document.getElementById('paginationWrap');
    const pageSize = 16;

    let selectedCategory = getQueryParam('category') || 'All';
    let searchText = searchTerm;
    let currentPage = 1;

    const renderPagination = (totalItems) => {
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        currentPage = Math.min(currentPage, totalPages);

        if (!paginationWrap) return;

        const pageButtons = Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            return `
                <button class="page-number ${page === currentPage ? 'active' : ''}" data-page="${page}">${page}</button>
            `;
        }).join('');

        paginationWrap.innerHTML = `
            <div class="pagination-info">Нийт ${totalItems} жороос ${currentPage}/${totalPages} хуудас</div>
            <div class="pagination-controls">
                <button class="page-nav" data-page-nav="prev" ${currentPage === 1 ? 'disabled' : ''}>Өмнөх</button>
                ${pageButtons}
                <button class="page-nav" data-page-nav="next" ${currentPage === totalPages ? 'disabled' : ''}>Дараах</button>
            </div>
        `;

        paginationWrap.querySelectorAll('[data-page]').forEach((button) => {
            button.addEventListener('click', () => {
                currentPage = Number(button.dataset.page);
                render();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        paginationWrap.querySelector('[data-page-nav="prev"]')?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage -= 1;
                render();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        paginationWrap.querySelector('[data-page-nav="next"]')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage += 1;
                render();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    };

    const render = () => {
        const favoriteIds = (JSON.parse(localStorage.getItem('favoriteRecipes') || '[]') || []).map(String);
        const filtered = recipes
            .filter((recipe) => !favoritesOnly || favoriteIds.includes(String(recipe.id)))
            .filter((recipe) => selectedCategory === 'All' || recipe.category === selectedCategory)
            .filter((recipe) => {
                const target = `${recipe.title} ${recipe.description} ${recipe.category} ${formatCategory(recipe.category)}`.toLowerCase();
                return target.includes(searchText.toLowerCase());
            });

        const sorted = sortRecipes(filtered, sortSelect.value);
        const start = (currentPage - 1) * pageSize;
        const pagedRecipes = sorted.slice(start, start + pageSize);

        recipesList.innerHTML = pagedRecipes.length
            ? pagedRecipes.map((recipe) => RecipeCard.render(recipe, '../')).join('')
            : '<p class="empty-state">Хадгалсан жор одоогоор алга байна.</p>';
        if (resultCount) {
            resultCount.textContent = `${sorted.length} жороос ${pagedRecipes.length} нь энэ хуудсанд харагдаж байна`;
        }
        renderPagination(sorted.length);
    };

    categoryButtons.forEach((button) => {
        if (button.dataset.category === selectedCategory) {
            categoryButtons.forEach((item) => item.classList.remove('active'));
            button.classList.add('active');
        }

        button.addEventListener('click', () => {
            categoryButtons.forEach((item) => item.classList.remove('active'));
            button.classList.add('active');
            selectedCategory = button.dataset.category;
            currentPage = 1;
            render();
        });
    });

    sortSelect.addEventListener('change', () => {
        currentPage = 1;
        render();
    });

    window.addEventListener('favoritesChanged', () => {
        if (!favoritesOnly) return;
        currentPage = 1;
        render();
    });

    searchInputs.forEach((input) => {
        input.addEventListener('input', (event) => {
            searchText = event.target.value;
            searchInputs.forEach((item) => {
                if (item !== event.target) item.value = searchText;
            });
            currentPage = 1;
            render();
        });
    });

    render();
}
