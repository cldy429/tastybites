import { formatCategory, formatRating, formatTime, getUserRatingStats } from '../utils/helpers.js';

export class RecipeCard {
    static render(recipe, imagePrefix = '') {
        const detailHref = imagePrefix === '../'
            ? `recipe-detail.html?id=${recipe.id}`
            : `html/recipe-detail.html?id=${recipe.id}`;
        const favoriteIds = (JSON.parse(localStorage.getItem('favoriteRecipes') || '[]') || []).map(String);
        const isFavorite = favoriteIds.includes(String(recipe.id));
        const ratingStats = getUserRatingStats(recipe);

        return `
            <article class="recipe-card">
                <a class="recipe-card-link transition-link" href="${detailHref}">
                    <div class="recipe-image-wrap">
                        <img src="${imagePrefix}${recipe.image}" class="recipe-image" alt="${recipe.title}">
                        <span class="category">${formatCategory(recipe.category)}</span>
                        <i class="${isFavorite ? 'fa-solid is-active' : 'fa-regular'} fa-heart favourite" data-recipe-id="${recipe.id}"></i>
                    </div>
                    <div class="recipe-content">
                        <h4>${recipe.title}</h4>
                        <p>${recipe.description}</p>
                    </div>
                    <div class="recipe-info">
                        <span><i class="fa-solid fa-star"></i> ${formatRating(ratingStats.average, ratingStats.count)}</span>
                        <span><i class="fa-regular fa-clock"></i> ${formatTime(recipe.time)}</span>
                    </div>
                    <div class="recipe-social-proof">
                        <span><i class="fa-regular fa-comment"></i> ${ratingStats.commentCount} сэтгэгдэл</span>
                    </div>
                </a>
            </article>
        `;
    }
}
