import { formatCategory } from '../utils/helpers.js';

const categoryIcons = {
    Breakfast: 'fa-mug-hot',
    Lunch: 'fa-bowl-rice',
    Dinner: 'fa-utensils',
    Dessert: 'fa-ice-cream',
    Healthy: 'fa-leaf',
    Soup: 'fa-bowl-food',
    Snack: 'fa-cookie-bite',
    Traditional: 'fa-drumstick-bite'
};

export async function initAdminPage(recipeService) {
    const adminRoot = document.getElementById('adminPanel');
    if (!adminRoot) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || currentUser.role !== 'admin') return;

    // --- Өгөгдөл хадгалах хувьсагчууд ---
    let recipes = [];
    let editingId = null;
    let searchText = '';

    // --- DOM Элементүүд ---
    const form = document.getElementById('adminRecipeForm');
    const tableBody = document.getElementById('adminRecipeRows');
    const statsContainer = document.getElementById('adminStats');
    const formTitle = document.getElementById('adminFormTitle');
    const cancelButton = document.getElementById('adminCancelEdit');
    const searchInput = document.getElementById('adminSearch');
    const categorySelect = form?.querySelector('[name="category"]');

    const featuredGrid = document.getElementById('featuredGrid');

    if (!form || !tableBody) return;

    // --- 1. Төрлүүдийг ачаалж Select-ийг дүүргэх ---
    const loadCategories = async () => {
        try {
            const categories = await recipeService.getCategories();
            if (categorySelect && categories.length > 0) {
                categorySelect.innerHTML = categories
                    .map(cat => {
                        const name = typeof cat === 'string' ? cat : cat.name;
                        return `<option value="${name}">${formatCategory(name)}</option>`;
                    })
                    .join('');
            }
        } catch (err) {
            console.error("Төрөл ачаалахад алдаа гарлаа:", err);
        }
    };

    // --- 2. Статистик харуулах ---
    const renderStats = () => {
        if (!statsContainer) return;
        statsContainer.innerHTML = `
            <article><strong>${recipes.length}</strong><span>Нийт жор</span></article>
            <article><strong>${recipes.filter(r => r.featured).length}</strong><span>Онцлох</span></article>
        `;
    };

    // --- Онцлох жорууд ---
    const renderFeatured = () => {
        if (!featuredGrid) return;
        const featured = recipes.filter(r => r.featured);
        const notFeatured = recipes.filter(r => !r.featured);

        featuredGrid.innerHTML = `
            <div class="featured-current">
                <h4>Онцолсон (${featured.length})</h4>
                ${featured.length === 0 ? '<p style="color:gray;">Онцлох жор байхгүй байна.</p>' : ''}
                <div class="featured-list">
                    ${featured.map(r => {
                        const rid = r._id || r.id;
                        return `
                        <div class="featured-item active">
                            <img src="../${r.image}" alt="${r.title}">
                            <span>${r.title}</span>
                            <button type="button" class="featured-toggle remove" data-id="${rid}" title="Хасах">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>`;
                    }).join('')}
                </div>
            </div>
            <div class="featured-available">
                <h4>Бүх жорууд</h4>
                <div class="featured-list">
                    ${notFeatured.map(r => {
                        const rid = r._id || r.id;
                        return `
                        <div class="featured-item">
                            <img src="../${r.image}" alt="${r.title}">
                            <span>${r.title}</span>
                            <button type="button" class="featured-toggle add" data-id="${rid}" title="Онцлох">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    };

    featuredGrid?.addEventListener('click', async (e) => {
        const btn = e.target.closest('.featured-toggle');
        if (!btn) return;
        const id = btn.dataset.id;
        const isRemove = btn.classList.contains('remove');
        try {
            await recipeService.updateRecipe(id, { featured: !isRemove });
            await loadData();
        } catch (err) {
            alert("Алдаа гарлаа: " + err.message);
        }
    });

    // --- 3. Хүснэгт зурах ---
    const renderTable = () => {
        const filtered = recipes.filter((r) => {
            const lowerQuery = searchText.toLowerCase();
            const categoryLabel = formatCategory(r.category || '');
            return r.title.toLowerCase().includes(lowerQuery) ||
                (r.category || '').toLowerCase().includes(lowerQuery) ||
                categoryLabel.toLowerCase().includes(lowerQuery);
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:gray;">Мэдээлэл олдсонгүй.</td></tr>`;
            return;
        }

        tableBody.innerHTML = filtered.map(recipe => {
            const rid = recipe._id || recipe.id;
            const categoryLabel = formatCategory(recipe.category || '');
            // Линкийг хаана байгаагаас хамаарч тохируулах
            const detailUrl = window.location.pathname.includes('/html/') 
                ? `recipe-detail.html?id=${rid}` 
                : `html/recipe-detail.html?id=${rid}`;

            return `
            <tr>
                <td class="col-id" title="${rid}">${rid.toString().slice(-6)}</td>
                <td class="col-name">
                    <strong>${recipe.title}</strong>
                    <p style="font-size:11px; color:gray; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        ${recipe.description}
                    </p>
                </td>
                <td>${categoryLabel}</td>
                <td>${recipe.time} мин</td>
                <td>
                    ${recipe.featured ? '<span title="Онцлох">⭐</span>' : ''}
                </td>
                <td class="col-action">
                    <div class="action-buttons">
                        <a href="${detailUrl}" class="admin-icon-button view" title="Харах">
                            <i class="fa-solid fa-eye"></i>
                        </a>
                        <button type="button" class="admin-icon-button edit" data-id="${rid}" title="Засах">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="admin-icon-button danger delete" data-id="${rid}" title="Устгах">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    };

    // --- 4. Өгөгдлийг серверээс ачаалах ---
    const loadData = async () => {
        try {
            recipes = await recipeService.getRecipes();
            renderStats();
            renderFeatured();
            renderTable();
        } catch (err) {
            console.error("Дата ачаалахад алдаа:", err);
        }
    };

    // --- 5. Товчлууруудын логик (Edit & Delete) ---
    tableBody.addEventListener('click', async (e) => {
        // Edit товч дарагдсан эсэхийг шалгах
        const editBtn = e.target.closest('.edit');
        if (editBtn) {
            const id = editBtn.dataset.id;
            const recipe = recipes.find(r => (r._id || r.id).toString() === id);
            if (!recipe) return;

            editingId = id;
            formTitle.textContent = "Жор засах #" + id.slice(-6);
            cancelButton.hidden = false;

            // Формыг өгөгдлөөр дүүргэх
            form.elements.title.value = recipe.title || '';
            form.elements.category.value = recipe.category || '';
            form.elements.description.value = recipe.description || '';
            form.elements.image.value = recipe.image || '';
            form.elements.time.value = recipe.time || 0;
            form.elements.servings.value = recipe.servings || 1;
            form.elements.rating.value = recipe.rating || 0;
            form.elements.reviews.value = recipe.reviews || 0;
            
            // Массивуудыг текст болгох
            form.elements.ingredients.value = recipe.ingredients ? recipe.ingredients.join('\n') : '';
            form.elements.instructions.value = recipe.instructions ? recipe.instructions.join('\n') : '';
            
            // Nutrition
            form.elements.calories.value = recipe.nutrition?.Calories || '';
            form.elements.protein.value = recipe.nutrition?.Protein || '';
            form.elements.carbs.value = recipe.nutrition?.Carbs || '';
            form.elements.fat.value = recipe.nutrition?.Fat || '';

            window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
        }

        // Delete товч дарагдсан эсэхийг шалгах
        const deleteBtn = e.target.closest('.delete');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm("Устгахдаа итгэлтэй байна уу?")) {
                try {
                    await recipeService.deleteRecipe(id);
                    await loadData();
                } catch (err) {
                    alert("Устгахад алдаа гарлаа.");
                }
            }
        }
    });

    // --- 6. Форм илгээх (Add & Update) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const selCat = formData.get('category');

        const recipeData = {
            title: formData.get('title'),
            category: selCat,
            categoryIcon: categoryIcons[selCat] || 'fa-utensils',
            description: formData.get('description'),
            image: formData.get('image') || 'images/sandwich.png',
            time: Number(formData.get('time')),
            servings: Number(formData.get('servings')),
            rating: Number(formData.get('rating')),
            reviews: Number(formData.get('reviews')),
            // Текстийг массив болгох
            ingredients: formData.get('ingredients').split('\n').map(s => s.trim()).filter(Boolean),
            instructions: formData.get('instructions').split('\n').map(s => s.trim()).filter(Boolean),
            nutrition: {
                Calories: formData.get('calories'),
                Protein: formData.get('protein'),
                Carbs: formData.get('carbs'),
                Fat: formData.get('fat')
            }
        };

        try {
            if (editingId) {
                await recipeService.updateRecipe(editingId, recipeData);
                alert("Амжилттай шинэчлэгдлээ!");
            } else {
                await recipeService.addRecipe(recipeData);
                alert("Амжилттай хадгалагдлаа!");
            }
            // Reset state
            editingId = null;
            form.reset();
            formTitle.textContent = "Шинэ жор нэмэх";
            cancelButton.hidden = true;
            await loadData();
        } catch (err) {
            alert("Хадгалахад алдаа гарлаа: " + err.message);
        }
    });

    // --- 7. Хайлт ба Болих үйлдлүүд ---
    searchInput?.addEventListener('input', (e) => {
        searchText = e.target.value;
        renderTable();
    });

    cancelButton?.addEventListener('click', () => {
        editingId = null;
        form.reset();
        formTitle.textContent = "Шинэ жор нэмэх";
        cancelButton.hidden = true;
    });

    // --- 8. Эхлүүлэх ---
    await loadCategories();
    await loadData();
}