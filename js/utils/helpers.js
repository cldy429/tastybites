export function formatTime(minutes) {
    return `${minutes} мин`;
}

export function formatRating(rating, reviews) {
    return `${rating} (${reviews})`;
}

export function getUserRatingStats(recipe) {
    const comments = Array.isArray(recipe.comments) ? recipe.comments : [];

    return {
        average: Number(recipe.rating || 0).toFixed(1),
        count: Number(recipe.reviews || 0),
        commentCount: comments.length,
        hasUserRatings: comments.length > 0
    };
}

export function formatCategory(category) {
    const labels = {
        All: 'Бүгд',
        Breakfast: 'Өглөөний хоол',
        Lunch: 'Өдрийн хоол',
        Dinner: 'Оройн хоол',
        Dessert: 'Амттан',
        Healthy: 'Эрүүл',
        Soup: 'Шөл',
        Snack: 'Зууш',
        Traditional: 'Уламжлалт'
    };

    return labels[category] || category;
}

export function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

export function isHomePage() {
    const path = window.location.pathname.replace(/\\/g, '/');
    return path.endsWith('/index.html') || path === '/' || path === '';
}

export function calculateStats(recipes) {
    if (!recipes || recipes.length === 0) {
        return { totalRecipes: 0, totalCategories: 0, averageRating: 0 };
    }
    const totalRecipes = recipes.length;
    const totalCategories = [...new Set(recipes.map((recipe) => recipe.category))].length;
    const averageRating = recipes.reduce((sum, recipe) => sum + recipe.rating, 0) / totalRecipes;

    return {
        totalRecipes,
        totalCategories,
        averageRating: averageRating.toFixed(1)
    };
}

export function getCategoryCounts(recipes) {
    return recipes.reduce((counts, recipe) => {
        counts[recipe.category] = (counts[recipe.category] || 0) + 1;
        return counts;
    }, {});
}

export function sortRecipes(recipes, sortBy) {
    const copied = [...recipes];

    if (sortBy === 'A-Z') {
        return copied.sort((a, b) => a.title.localeCompare(b.title, 'mn'));
    }

    if (sortBy === 'Z-A') {
        return copied.sort((a, b) => b.title.localeCompare(a.title, 'mn'));
    }

    if (sortBy === 'RatingDesc') {
        return copied.sort((a, b) => b.rating - a.rating);
    }

    if (sortBy === 'RatingAsc') {
        return copied.sort((a, b) => a.rating - b.rating);
    }

    if (sortBy === 'Newest') {
        return copied.sort((a, b) => String(b.id || b._id).localeCompare(String(a.id || a._id)));
    }

    if (sortBy === 'Oldest') {
        return copied.sort((a, b) => String(a.id || a._id).localeCompare(String(b.id || b._id)));
    }

    return copied;
}
