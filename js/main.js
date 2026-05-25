import { RecipeService } from './services/recipeService.js';
import { initHomePage } from './pages/homePage.js';
import { initRecipesPage } from './pages/recipesPage.js';
import { initRecipeDetailPage } from './pages/recipeDetailPage.js';
import { initAdminPage } from './pages/adminPage.js';
import { initProfilePage } from './pages/profilePage.js';

const recipeService = new RecipeService();
const transitionDelay = 650;

function openLoginModel() {
    document.getElementById('loginModel')?.classList.add('active');
}

function closeLoginModel() {
    document.getElementById('loginModel')?.classList.remove('active');
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify({
        name: user.name,
        email: user.email,
        role: user.role
    }));
}

function logout() {
    localStorage.removeItem('currentUser');
    const paths = getPagePaths();
    window.location.href = paths.home;
}

async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const error = form.querySelector('[data-login-error]');

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
            if (error) {
                error.textContent = data.error || 'Нэвтрэх боломжгүй байна.';
                error.hidden = false;
            }
            return;
        }

        if (error) error.hidden = true;
        setCurrentUser(data);
        closeLoginModel();

        if (data.role === 'admin') {
            window.location.href = 'html/profile.html';
            return;
        }

        updateAuthUI();
    } catch {
        if (error) {
            error.textContent = 'Серверт холбогдож чадсангүй.';
            error.hidden = false;
        }
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const inputs = form.querySelectorAll('input');
    const error = form.querySelector('[data-register-error]');
    const name = inputs[0].value.trim();
    const email = inputs[1].value.trim().toLowerCase();
    const password = inputs[2].value;
    const confirmPassword = inputs[3].value;

    if (password !== confirmPassword) {
        if (error) {
            error.textContent = 'Нууц үг таарахгүй байна.';
            error.hidden = false;
        }
        return;
    }

    if (password.length < 6) {
        if (error) {
            error.textContent = 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.';
            error.hidden = false;
        }
        return;
    }

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (!res.ok) {
            if (error) {
                error.textContent = data.error || 'Бүртгэл амжилтгүй.';
                error.hidden = false;
            }
            return;
        }

        if (error) error.hidden = true;
        setCurrentUser(data);
        const paths = getPagePaths();
        window.location.href = paths.home;
    } catch {
        if (error) {
            error.textContent = 'Серверт холбогдож чадсангүй.';
            error.hidden = false;
        }
    }
}

window.openLoginModel = openLoginModel;
window.closeLoginModel = closeLoginModel;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;

function getDrawerLinks() {
    const isInHtmlFolder = window.location.pathname.replace(/\\/g, '/').includes('/html/');
    const homeHref = isInHtmlFolder ? '../index.html' : 'index.html';
    const recipesHref = isInHtmlFolder ? 'recipes.html' : 'html/recipes.html';
    const favoritesHref = isInHtmlFolder ? 'recipes.html?favorites=1' : 'html/recipes.html?favorites=1';
    const profileHref = isInHtmlFolder ? 'profile.html' : 'html/profile.html';
    const adminHref = isInHtmlFolder ? 'profile.html' : 'html/profile.html';
    const user = getCurrentUser();
    const links = [
        { href: homeHref, label: 'Нүүр', icon: 'fa-house' },
        { href: recipesHref, label: 'Жорууд', icon: 'fa-book-open' },
        { href: favoritesHref, label: 'Хадгалсан', icon: 'fa-heart' },
        { href: profileHref, label: 'Профайл', icon: 'fa-user' }
    ];

    return links;
}

function getPagePaths() {
    const isInHtmlFolder = window.location.pathname.replace(/\\/g, '/').includes('/html/');

    return {
        home: isInHtmlFolder ? '../index.html' : 'index.html',
        recipes: isInHtmlFolder ? 'recipes.html' : 'html/recipes.html',
        favorites: isInHtmlFolder ? 'recipes.html?favorites=1' : 'html/recipes.html?favorites=1',
        healthy: isInHtmlFolder ? 'recipes.html?category=Healthy' : 'html/recipes.html?category=Healthy',
        membership: isInHtmlFolder ? 'profile.html' : 'html/profile.html',
        profile: isInHtmlFolder ? 'profile.html' : 'html/profile.html'
    };
}

function renderFooter() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const paths = getPagePaths();
    footer.innerHTML = `
        <div class="footer-inner">
            <section class="footer-brand">
                <a class="logo transition-link" href="${paths.home}" aria-label="TastyBites Home">
                    <span class="logo-icon"><i class="fa-solid fa-bowl-food"></i></span>
                    <span class="logo-text">TastyBites</span>
                </a>
                <p>Өдөр бүрийн амтат хоолны санаа, хялбар жоруудыг нэг дороос.</p>
                <div class="footer-socials">
                    <a href="${paths.favorites}" aria-label="Хадгалсан"><i class="fa-solid fa-heart"></i></a>
                    <a href="${paths.recipes}" aria-label="Жорууд"><i class="fa-solid fa-book-open"></i></a>
                    <a href="${paths.membership}" aria-label="Профайл"><i class="fa-solid fa-user"></i></a>
                </div>
            </section>
            <section class="footer-links">
                <h4>Цэс</h4>
                <a class="transition-link" href="${paths.home}">Нүүр</a>
                <a class="transition-link" href="${paths.recipes}">Жорууд</a>
                <a class="transition-link" href="${paths.healthy}">Эрүүл</a>
                <a class="transition-link" href="${paths.membership}">Sign Up</a>
            </section>
            <section class="footer-links">
                <h4>Төрлүүд</h4>
                <a class="transition-link" href="${paths.recipes}?category=Breakfast">Өглөөний хоол</a>
                <a class="transition-link" href="${paths.recipes}?category=Lunch">Өдрийн хоол</a>
                <a class="transition-link" href="${paths.recipes}?category=Dinner">Оройн хоол</a>
                <a class="transition-link" href="${paths.recipes}?category=Dessert">Амттан</a>
            </section>
        </div>
        <div class="footer-bottom">
            <span>© 2026 TastyBites</span>
            <span>Жор сонирхогчдод зориулав</span>
        </div>
    `;
}

function updateAuthUI() {
    const user = getCurrentUser();

    document.querySelectorAll('.login').forEach((button) => {
        if (user) {
            button.textContent = 'Гарах';
            button.onclick = logout;
            return;
        }

        button.textContent = 'Нэвтрэх';
    });

    const isInHtmlFolder = window.location.pathname.replace(/\\/g, '/').includes('/html/');

    document.querySelectorAll('.header-right').forEach((container) => {
        // Profile link
        const existingProfileLink = container.querySelector('.profile-header-link');
        if (user && !existingProfileLink) {
            const profileLink = document.createElement('a');
            profileLink.className = 'profile-header-link transition-link';
            profileLink.href = isInHtmlFolder ? 'profile.html' : 'html/profile.html';
            profileLink.innerHTML = '<i class="fa-solid fa-user"></i>';
            profileLink.title = user.name;
            container.insertBefore(profileLink, container.querySelector('.login'));
        }
        if (!user && existingProfileLink) {
            existingProfileLink.remove();
        }

    });
}

function protectAdminPage() {
    return true;
}

function setupFavoriteButtons() {
    const getFavoriteIds = () => (JSON.parse(localStorage.getItem('favoriteRecipes') || '[]') || []).map(String);
    const setFavoriteIds = (ids) => localStorage.setItem('favoriteRecipes', JSON.stringify(ids.map(String)));
    const syncSaveButtons = () => {
        const favoriteIds = getFavoriteIds();
        document.querySelectorAll('.save-recipe[data-recipe-id]').forEach((button) => {
            const recipeId = button.dataset.recipeId;
            const isFavorite = favoriteIds.includes(recipeId);
            button.classList.toggle('is-active', isFavorite);
            button.innerHTML = isFavorite
                ? '<i class="fa-solid fa-heart"></i> Хадгалсан'
                : '<i class="fa-regular fa-heart"></i> Хадгалах';
        });
    };

    syncSaveButtons();

    document.addEventListener('click', (event) => {
        const favoriteIcon = event.target.closest('.favourite');
        if (favoriteIcon) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            const recipeId = favoriteIcon.dataset.recipeId;
            const favoriteIds = getFavoriteIds();
            const isFavorite = favoriteIds.includes(recipeId);
            const nextFavoriteIds = isFavorite
                ? favoriteIds.filter((id) => id !== recipeId)
                : [...favoriteIds, recipeId];

            setFavoriteIds(nextFavoriteIds);
            favoriteIcon.classList.toggle('fa-regular', isFavorite);
            favoriteIcon.classList.toggle('fa-solid', !isFavorite);
            favoriteIcon.classList.toggle('is-active', !isFavorite);
            window.dispatchEvent(new CustomEvent('favoritesChanged'));
            return;
        }

        const saveButton = event.target.closest('.save-recipe');
        if (!saveButton) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const recipeId = saveButton.dataset.recipeId;
        const favoriteIds = getFavoriteIds();
        const isFavorite = favoriteIds.includes(recipeId);
        const nextFavoriteIds = isFavorite
            ? favoriteIds.filter((id) => id !== recipeId)
            : [...favoriteIds, recipeId];

        setFavoriteIds(nextFavoriteIds);
        syncSaveButtons();
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
    });
}

function setupResponsiveDrawer() {
    const hamburgerButtons = Array.from(document.querySelectorAll('.hamburger'));
    if (!hamburgerButtons.length || document.querySelector('.side-drawer')) return;

    const links = getDrawerLinks();
    const isHomePage = Boolean(document.getElementById('loginModel'));
    const loginHref = window.location.pathname.replace(/\\/g, '/').includes('/html/')
        ? '../index.html?openLogin=1'
        : 'index.html?openLogin=1';
    const paths = getPagePaths();
    const user = getCurrentUser();
    const drawer = document.createElement('aside');
    drawer.className = 'side-drawer';
    drawer.innerHTML = `
        <div class="drawer-panel">
            <div class="drawer-top">
                <a class="logo transition-link" href="${paths.home}" aria-label="TastyBites Home">
                    <span class="logo-icon"><i class="fa-solid fa-bowl-food"></i></span>
                    <span class="logo-text">TastyBites</span>
                </a>
                <button class="drawer-close" type="button" aria-label="Close menu">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <nav class="drawer-nav">
                <button class="drawer-link drawer-action" type="button" data-drawer-login="true">
                    <i class="fa-solid ${user ? 'fa-right-from-bracket' : 'fa-right-to-bracket'}"></i>
                    <span>${user ? 'Гарах' : 'Нэвтрэх'}</span>
                </button>
                ${links.map((link) => `
                    <a class="drawer-link transition-link" href="${link.href}">
                        <i class="fa-solid ${link.icon}"></i>
                        <span>${link.label}</span>
                    </a>
                `).join('')}
            </nav>
        </div>
    `;

    document.body.appendChild(drawer);

    const closeDrawer = () => {
        drawer.classList.remove('active');
        document.body.classList.remove('drawer-open');
    };

    const openDrawer = () => {
        drawer.classList.add('active');
        document.body.classList.add('drawer-open');
    };

    hamburgerButtons.forEach((button) => {
        button.addEventListener('click', openDrawer);
    });

    drawer.querySelector('.drawer-close')?.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', (event) => {
        if (event.target === drawer) closeDrawer();
    });

    drawer.querySelector('[data-drawer-login="true"]')?.addEventListener('click', () => {
        closeDrawer();

        if (getCurrentUser()) {
            logout();
            return;
        }

        if (isHomePage) {
            openLoginModel();
            return;
        }

        window.location.href = loginHref;
    });

    drawer.querySelectorAll('.drawer-link').forEach((link) => {
        if (link.tagName === 'A') {
            link.addEventListener('click', closeDrawer);
        }
    });
}

function ensurePageTransition() {
    if (document.querySelector('.page-transition')) return;

    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    overlay.innerHTML = `
        <div class="page-transition-logo">
            <span class="logo-icon"><i class="fa-solid fa-bowl-food"></i></span>
            <span class="logo-text">TastyBites</span>
        </div>
    `;

    document.body.appendChild(overlay);

    const resetTransition = () => {
        overlay.classList.remove('active');
        document.body.classList.remove('is-transitioning');
    };

    requestAnimationFrame(() => {
        document.body.classList.add('page-ready');
        resetTransition();
    });

    window.addEventListener('pageshow', resetTransition);
    window.addEventListener('pagehide', () => {
        window.setTimeout(resetTransition, 0);
    });

    document.addEventListener('click', (event) => {
        if (event.target.closest('.favourite, .save-recipe')) return;

        const link = event.target.closest('.transition-link');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || link.target === '_blank') return;
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        event.preventDefault();
        document.body.classList.add('is-transitioning');
        overlay.classList.add('active');

        window.setTimeout(() => {
            window.location.href = link.href;
        }, transitionDelay);
    });
}

async function initPage() {
    ensurePageTransition();
    renderFooter();
    if (!protectAdminPage()) return;
    setupResponsiveDrawer();
    setupFavoriteButtons();
    setupGlobalSearch();
    updateAuthUI();
    if (new URLSearchParams(window.location.search).get('openLogin') === '1') {
        openLoginModel();
    }
    await initHomePage(recipeService);
    await initRecipesPage(recipeService);
    await initRecipeDetailPage(recipeService);
    await initAdminPage(recipeService);
    await initProfilePage(recipeService);
}

function setupGlobalSearch(){
    const searchInput = document.querySelectorAll('[data-search-input]');
    searchInput.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if(e.key == 'Enter'){
                const query = e.target.value.trim();
                if(query){
                    const isInHtmlFolder = window.location.pathname.includes('/html/');
                    const recipesPath = isInHtmlFolder ? 'recipes.html' : 'html/recipes.html';
                    window.location.href = `${recipesPath}?search=${encodeURIComponent(query)}`;
                }
            }
        })
    })
}

initPage().catch((error) => {
    console.error(error);
});
