import { formatCategory } from '../utils/helpers.js';

export class CategoryCard {
    static render(category, count) {
        return `
            <a class="category-card category-card-link transition-link" href="html/recipes.html?category=${encodeURIComponent(category.name)}">
                <i class="fa-solid ${category.icon}"></i>
                <h4>${formatCategory(category.name)}</h4>
                <p>${count} жор</p>
            </a>
        `;
    }
}
