import { escapeHtml, formatCategory, formatTime, getQueryParam, getUserRatingStats } from '../utils/helpers.js';

function renderStars(rating) {
    const fullStars = Math.floor(Number(rating) || 0);
    const hasHalfStar = Number(rating) - fullStars >= 0.5;

    return Array.from({ length: 5 }, (_, index) => {
        if (index < fullStars) return '<i class="fa-solid fa-star"></i>';
        if (index === fullStars && hasHalfStar) return '<i class="fa-solid fa-star-half-stroke"></i>';
        return '<i class="fa-regular fa-star"></i>';
    }).join('');
}

function renderRatingButtons(selectedRating = 5) {
    return Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1;
        const isActive = rating <= selectedRating;
        return `
            <button class="review-star ${isActive ? 'is-active' : ''}" type="button" data-rating="${rating}" aria-label="${rating} од">
                <i class="${isActive ? 'fa-solid' : 'fa-regular'} fa-star"></i>
            </button>
        `;
    }).join('');
}

function renderComments(comments = []) {
    if (!comments.length) {
        return '<p class="detail-comment-empty">Одоогоор сэтгэгдэл алга байна.</p>';
    }

    return comments.map((item) => `
        <article class="detail-comment">
            <div>
                <strong>${escapeHtml(item.name || 'Зочин')}</strong>
                <span>${renderStars(item.rating)} ${Number(item.rating || 0).toFixed(1)}</span>
            </div>
            <p>${escapeHtml(item.comment)}</p>
        </article>
    `).join('');
}

export async function initRecipeDetailPage(recipeService) {
    const detailContainer = document.getElementById('recipeDetailContainer');
    if (!detailContainer) return;

    const recipeId = getQueryParam('id') || '1';
    let recipe = await recipeService.getRecipeById(recipeId);

    if (!recipe) {
        detailContainer.innerHTML = '<p>Сонгосон жор олдсонгүй.</p>';
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    const renderRecipe = () => {
        const comments = Array.isArray(recipe.comments) ? recipe.comments : [];
        const ratingStats = getUserRatingStats(recipe);
        const nutritionRows = Object.entries(recipe.nutrition || {})
            .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`)
            .join('');
        const ingredientItems = recipe.ingredients.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
        const instructionItems = recipe.instructions.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
        const favoriteIds = (JSON.parse(localStorage.getItem('favoriteRecipes') || '[]') || []).map(String);
        const isFavorite = favoriteIds.includes(String(recipe.id));

        detailContainer.innerHTML = `
            <div class="detail-image-wrap">
                <img src="../${escapeHtml(recipe.image)}" class="detail-hero-image" alt="${escapeHtml(recipe.title)}">
                <span class="category">${formatCategory(recipe.category)}</span>
            </div>
            <h1 class="detail-title">${escapeHtml(recipe.title)}</h1>
            <p class="detail-description">${escapeHtml(recipe.description)}</p>
            <div class="detail-meta">
                <article class="detail-rating">
                    ${renderStars(ratingStats.average)}
                    <span>${ratingStats.average}</span>
                    <span class="review-count">(${ratingStats.count} үнэлгээ, ${comments.length} сэтгэгдэл)</span>
                </article>
                <span><i class="fa-regular fa-clock"></i> ${formatTime(recipe.time)}</span>
                <span><i class="fa-solid fa-users"></i> ${recipe.servings} хүний порц</span>
            </div>
            <button class="save-recipe ${isFavorite ? 'is-active' : ''}" data-recipe-id="${recipe.id}">
                <i class="${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart"></i> ${isFavorite ? 'Хадгалсан' : 'Хадгалах'}
            </button>
            <section class="detail-content">
                <div class="detail-ingredients">
                    <h2>Орц</h2>
                    <ul>${ingredientItems}</ul>
                </div>
                <div class="detail-instructions">
                    <h2>Хийх дараалал</h2>
                    <ol>${instructionItems}</ol>
                </div>
            </section>
            <section class="detail-feedback">
                <div class="detail-review-form">
                    <div class="review-form-head">
                        <div>
                            <span>Таны санал</span>
                            <h2>Үнэлгээ, сэтгэгдэл үлдээх</h2>
                        </div>
                        <strong>${ratingStats.average}</strong>
                    </div>
                    <form id="reviewForm">
                        <label ${currentUser ? 'hidden' : ''}>
                            <span>Нэр</span>
                            <input type="text" name="name" maxlength="60" placeholder="Таны нэр" ${currentUser ? `value="${escapeHtml(currentUser.name)}"` : ''}>
                        </label>
                        <label>
                            <span>Үнэлгээ</span>
                            <input type="hidden" name="rating" value="5">
                            <div class="review-star-picker" data-rating-picker>
                                ${renderRatingButtons(5)}
                            </div>
                        </label>
                        <label>
                            <span>Сэтгэгдэл</span>
                            <textarea name="comment" maxlength="600" placeholder="Энэ жорын тухай сэтгэгдлээ бичнэ үү" required></textarea>
                        </label>
                        <button type="submit"><i class="fa-solid fa-paper-plane"></i> Илгээх</button>
                        <p class="review-message" id="reviewMessage" hidden></p>
                    </form>
                </div>
                <div class="detail-comments">
                    <div class="comments-head">
                        <h2>Сэтгэгдлүүд</h2>
                        <span>${comments.length}</span>
                    </div>
                    ${renderComments(comments)}
                </div>
            </section>
            <div class="detail-nutrition">
                <h2>Тэжээллэг чанар</h2>
                <table>${nutritionRows}</table>
            </div>
        `;

        const reviewForm = document.getElementById('reviewForm');
        const reviewMessage = document.getElementById('reviewMessage');
        const ratingInput = reviewForm?.elements.rating;

        detailContainer.querySelectorAll('.review-star').forEach((button) => {
            button.addEventListener('click', () => {
                const selectedRating = Number(button.dataset.rating);
                ratingInput.value = String(selectedRating);

                detailContainer.querySelectorAll('.review-star').forEach((starButton) => {
                    const isActive = Number(starButton.dataset.rating) <= selectedRating;
                    starButton.classList.toggle('is-active', isActive);
                    starButton.querySelector('i').className = `${isActive ? 'fa-solid' : 'fa-regular'} fa-star`;
                });
            });
        });

        reviewForm?.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(reviewForm);
            const review = {
                name: formData.get('name') || 'Зочин',
                rating: Number(formData.get('rating')),
                comment: formData.get('comment')
            };

            try {
                const updatedRecipe = await recipeService.addReview(recipe.id, review);

                recipe = updatedRecipe;
                renderRecipe();
                alert("Сэтгэгдэл амжилттай үлдлээ!");
            } catch (error) {
                alert("Алдаа: " + error.message);
            }
        });
    };

    renderRecipe();
}
