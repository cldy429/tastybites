import { RecipeCard } from '../components/RecipeCard.js';
import { CategoryCard } from '../components/CategoryCard.js';
import { calculateStats, getCategoryCounts } from '../utils/helpers.js';

export async function initHomePage(recipeService) {
    const featuredContainer = document.getElementById('featuredRecipes');
    if (!featuredContainer) return;

    const [recipes, categories] = await Promise.all([
        recipeService.getRecipes(),
        recipeService.getCategories()
    ]);

    const featuredRecipes = recipes.filter((recipe) => recipe.featured).slice(0, 4);
    const popularRecipes = [...recipes]
        .sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0))
        .slice(0, 6);
    const stats = calculateStats(recipes);
    const categoryCounts = getCategoryCounts(recipes);

    document.getElementById('featuredRecipes').innerHTML = featuredRecipes
        .map((recipe) => RecipeCard.render(recipe, ''))
        .join('');

    document.getElementById('popularRecipes').innerHTML = popularRecipes
        .map((recipe) => RecipeCard.render(recipe, ''))
        .join('');

    const showCategories = ['Breakfast', 'Lunch', 'Dinner', 'Healthy'];
    document.getElementById('categoryList').innerHTML = categories
        .filter((category) => showCategories.includes(category.name))
        .map((category) => CategoryCard.render(category, categoryCounts[category.name] || 0))
        .join('');

    document.getElementById('heroStats').innerHTML = `
        <div>
            <h3>${stats.totalCategories}</h3>
            <span>Төрөл</span>
        </div>
        <div>
            <h3>${stats.totalRecipes}</h3>
            <span>Жор</span>
        </div>
        <div>
            <h3>${stats.averageRating}</h3>
            <span>Дундаж үнэлгээ</span>
        </div>
    `;
}
