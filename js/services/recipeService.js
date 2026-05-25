export class RecipeService {
    constructor() {
        // Node.js сервер нэг порт дээр байгаа тул харьцангуй зам ашиглана
        this.baseUrl = '/api';
    }

    /**
     * MongoDB-ийн _id-г Frontend-д зориулж id болгож хувиргах туслах функц
     */
    _format(recipe) {
        if (!recipe) return null;
        return {
            ...recipe,
            id: recipe._id || recipe.id
        };
    }

    async getRecipes() {
        try {
            const response = await fetch(`${this.baseUrl}/recipes`);
            if (!response.ok) throw new Error('Жоруудыг ачаалж чадсангүй');
            const data = await response.json();
            return data.map(r => this._format(r));
        } catch (error) {
            console.error("RecipeService Error (getRecipes):", error);
            return [];
        }
    }

    async getCategories() {
        try {
            const response = await fetch(`${this.baseUrl}/categories`);
            if (!response.ok) throw new Error('Төрлүүдийг ачаалж чадсангүй');
            return await response.json();
        } catch (error) {
            console.error("RecipeService Error (getCategories):", error);
            return [];
        }
    }

    async getRecipeById(id) {
        try {
            const response = await fetch(`${this.baseUrl}/recipes/${id}`);
            if (!response.ok) return null;
            const data = await response.json();
            return this._format(data);
        } catch (error) {
            console.error(`RecipeService Error (getRecipeById ${id}):`, error);
            return null;
        }
    }

    async addReview(recipeId, reviewData) {
    const response = await fetch(`${this.baseUrl}/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
    });
    
    if (!response.ok) throw new Error('Сэтгэгдэл илгээхэд алдаа гарлаа');
    const data = await response.json();
    return { ...data, id: data._id };
}

    async addRecipe(recipeData) {
        try {
            const response = await fetch(`${this.baseUrl}/recipes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recipeData)
            });
            if (!response.ok) throw new Error('Жор нэмэхэд алдаа гарлаа');
            const newRecipe = await response.json();
            return this._format(newRecipe);
        } catch (error) {
            console.error("RecipeService Error (addRecipe):", error);
            throw error;
        }
    }

    async updateRecipe(id, recipeData) {
        try {
            const response = await fetch(`${this.baseUrl}/recipes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recipeData)
            });
            if (!response.ok) throw new Error('Жор шинэчлэхэд алдаа гарлаа');
            const updatedRecipe = await response.json();
            return this._format(updatedRecipe);
        } catch (error) {
            console.error("RecipeService Error (updateRecipe):", error);
            throw error;
        }
    }

    async deleteRecipe(id) {
        try {
            const response = await fetch(`${this.baseUrl}/recipes/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Жор устгахад алдаа гарлаа');
            return await response.json(); // { ok: true }
        } catch (error) {
            console.error("RecipeService Error (deleteRecipe):", error);
            throw error;
        }
    }
}