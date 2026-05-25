import { RecipeCard } from '../components/RecipeCard.js';
import { escapeHtml } from '../utils/helpers.js';

function renderStars(rating) {
    const fullStars = Math.floor(Number(rating) || 0);
    const hasHalfStar = Number(rating) - fullStars >= 0.5;

    return Array.from({ length: 5 }, (_, index) => {
        if (index < fullStars) return '<i class="fa-solid fa-star"></i>';
        if (index === fullStars && hasHalfStar) return '<i class="fa-solid fa-star-half-stroke"></i>';
        return '<i class="fa-regular fa-star"></i>';
    }).join('');
}

export async function initProfilePage(recipeService) {
    const profilePage = document.getElementById('profilePage');
    if (!profilePage) return;

    const profileHeader = document.getElementById('profileHeader');
    const profileContent = document.getElementById('profileContent');
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');

    // Нэвтрээгүй бол membership харуулах
    if (!user) {
        const membershipSection = document.getElementById('membershipSection');
        if (membershipSection) membershipSection.hidden = false;
        return;
    }

    // Admin бол admin panel харуулах
    if (user.role === 'admin') {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) adminPanel.hidden = false;
        return;
    }

    // User бол profile харуулах
    profilePage.hidden = false;

    // Header
    const initial = user.name.charAt(0).toUpperCase();
    profileHeader.innerHTML = `
        <div class="profile-info">
            <div class="profile-avatar">${initial}</div>
            <div>
                <h2>${escapeHtml(user.name)}</h2>
                <p>${escapeHtml(user.email)}</p>
            </div>
        </div>
    `;

    // Data
    const recipes = await recipeService.getRecipes();
    const favoriteIds = (JSON.parse(localStorage.getItem('favoriteRecipes') || '[]') || []).map(String);
    const favoriteRecipes = recipes.filter(r => favoriteIds.includes(String(r.id)));

    let userComments = [];
    try {
        const res = await fetch(`/api/user/comments?name=${encodeURIComponent(user.name)}`);
        if (res.ok) userComments = await res.json();
    } catch (err) {
        console.error('Сэтгэгдэл ачаалахад алдаа:', err);
    }

    // Tab rendering
    const renderFavorites = () => {
        if (favoriteRecipes.length === 0) {
            profileContent.innerHTML = `
                <div class="profile-empty">
                    <i class="fa-regular fa-heart"></i>
                    <p>Хадгалсан жор байхгүй байна</p>
                    <a href="recipes.html" class="profile-login-btn">Жорууд үзэх</a>
                </div>
            `;
            return;
        }
        profileContent.innerHTML = `
            <div class="profile-recipes">
                ${favoriteRecipes.map(r => RecipeCard.render(r, '../')).join('')}
            </div>
        `;
    };

    const renderComments = () => {
        if (userComments.length === 0) {
            profileContent.innerHTML = `
                <div class="profile-empty">
                    <i class="fa-regular fa-comment"></i>
                    <p>Сэтгэгдэл үлдээгээгүй байна</p>
                    <a href="recipes.html" class="profile-login-btn">Жорууд үзэх</a>
                </div>
            `;
            return;
        }
        profileContent.innerHTML = `
            <div class="profile-comments">
                ${userComments.map(c => `
                    <a class="profile-comment-card transition-link" href="recipe-detail.html?id=${c.recipeId}">
                        <img src="../${escapeHtml(c.recipeImage)}" alt="${escapeHtml(c.recipeTitle)}">
                        <div class="profile-comment-body">
                            <strong>${escapeHtml(c.recipeTitle)}</strong>
                            <span class="profile-comment-stars">${renderStars(c.rating)} ${Number(c.rating).toFixed(1)}</span>
                            <p>${escapeHtml(c.comment)}</p>
                        </div>
                    </a>
                `).join('')}
            </div>
        `;
    };

    // Default tab
    renderFavorites();

    // Tab switching
    profilePage.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            profilePage.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tab.dataset.tab === 'favorites') renderFavorites();
            else renderComments();
        });
    });
}
