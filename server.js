const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// --- 1. MongoDB Холболт ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB-тэй амжилттай холбогдлоо!"))
    .catch(err => console.error("❌ MongoDB холболтын алдаа:", err));

// --- Database Schemas (Загвар) ---
const recipeSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    image: String,
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    time: Number,
    servings: Number,
    featured: { type: Boolean, default: false },
    ingredients: [String],
    instructions: [String],
    nutrition: Object,
    comments: [{
        name: String,
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }]
});

const Recipe = mongoose.model('Recipe', recipeSchema);
const Category = mongoose.model('Category', new mongoose.Schema({ name: String, icon: String }));

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*' // CORS дэмжлэг
    });
    res.end(JSON.stringify(payload));
}

async function readRequestBody(req) {
    let body = '';
    for await (const chunk of req) body += chunk;
    return body ? JSON.parse(body) : {};
}

//API hsg-
async function handleApi(req, res, url) {
    const route = url.pathname;
    const method = req.method;

    if (method === 'GET' && route === '/api/recipes') {
        const recipes = await Recipe.find();
        return sendJson(res, 200, recipes.map(r => ({ ...r._doc, id: r._id })));
    }

    if (method === 'GET' && route === '/api/categories') {
        const categories = await Category.find();
        return sendJson(res, 200, categories);
    }

    // id aar jor avah
    const recipeMatch = route.match(/^\/api\/recipes\/([a-f\d]{24})$/);
    if (method === 'GET' && recipeMatch) {
        const recipe = await Recipe.findById(recipeMatch[1]);
        if (!recipe) return sendJson(res, 404, { error: 'Жор олдсонгүй' });
        return sendJson(res, 200, { ...recipe._doc, id: recipe._id });
    }

    // adminii heseg
    if (method === 'POST' && route === '/api/recipes') {
        const body = await readRequestBody(req);
        const newRecipe = new Recipe(body);
        await newRecipe.save();
        return sendJson(res, 201, newRecipe);
    }

    if (method === 'PUT' && recipeMatch) {
        const body = await readRequestBody(req);
        const updated = await Recipe.findByIdAndUpdate(recipeMatch[1], body, { new: true });
        return sendJson(res, 200, updated);
    }

    if (method === 'DELETE' && recipeMatch) {
        await Recipe.findByIdAndDelete(recipeMatch[1]);
        return sendJson(res, 200, { ok: true });
    }

    // setgegdel nemeh
    const commentMatch = route.match(/^\/api\/recipes\/([a-f\d]{24})\/comments$/);
    if (method === 'POST' && commentMatch) {
        const body = await readRequestBody(req);
        const recipe = await Recipe.findById(commentMatch[1]);
        if (!recipe) return sendJson(res, 404, { error: 'Жор олдсонгүй' });

        recipe.comments.unshift(body);
        recipe.reviews = recipe.comments.length;
        const totalRating = recipe.comments.reduce((sum, c) => sum + c.rating, 0);
        recipe.rating = Number((totalRating / recipe.comments.length).toFixed(1));

        await recipe.save();
        return sendJson(res, 201, { ...recipe._doc, id: recipe._id });
    }

    // --- Auth API ---
    if (method === 'POST' && route === '/api/register') {
        const body = await readRequestBody(req);
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return sendJson(res, 400, { error: 'Бүх талбарыг бөглөнө үү' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return sendJson(res, 409, { error: 'Энэ email бүртгэлтэй байна' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ name, email: email.toLowerCase(), password: hashed });
        await user.save();

        return sendJson(res, 201, { name: user.name, email: user.email, role: user.role });
    }

    if (method === 'POST' && route === '/api/login') {
        const body = await readRequestBody(req);
        const { email, password } = body;

        if (!email || !password) {
            return sendJson(res, 400, { error: 'Email, нууц үг оруулна уу' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return sendJson(res, 401, { error: 'Email эсвэл нууц үг буруу байна' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return sendJson(res, 401, { error: 'Email эсвэл нууц үг буруу байна' });
        }

        return sendJson(res, 200, { name: user.name, email: user.email, role: user.role });
    }

    return sendJson(res, 404, { error: 'API Endpoint олдсонгүй' });
}

// file uud unshij bga hsg
async function serveStatic(req, res, url) {
    const requestedPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = path.normalize(path.join(ROOT_DIR, requestedPath));

    try {
        const file = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        res.end(file);
    } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404</h1><p>Файл олдсонгүй.</p>');
    }
}

// server ehluulj bga hsg
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    try {
        if (url.pathname.startsWith('/api/')) {
            await handleApi(req, res, url);
        } else {
            await serveStatic(req, res, url);
        }
    } catch (error) {
        console.error("Сервер дээр алдаа гарлаа:", error);
        sendJson(res, 500, { error: 'Дотоод алдаа гарлаа' });
    }
});

server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`TastyBites FULL-STACK MONGODB BACKEND`);
    console.log(`Хаяг: http://localhost:${PORT}`);
    console.log(`=========================================`);
});