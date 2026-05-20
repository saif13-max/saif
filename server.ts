/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { DEFAULT_PRODUCTS } from './src/data/defaultProducts';
import { Product, Order, Review } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data-store.json');

// Initialize local database JSON store
let db = {
  products: [...DEFAULT_PRODUCTS],
  orders: [] as Order[],
  reviews: [
    {
      id: 'rev-1',
      productId: 'prod-1',
      customerName: 'Abdullah Saif',
      rating: 5,
      comment: 'Absolutely amazing refrigerator. It is totally silent, cooling is super-fast, and lookwise it looks premium in the kitchen. Inverter compressor saves electric bills!',
      date: '2026-05-18T12:00:00Z'
    },
    {
      id: 'rev-2',
      productId: 'prod-2',
      customerName: 'Ayesha Khan',
      rating: 4,
      comment: 'Very quiet washing machine. The steam cleaning cycle is highly effective for toddler clothes. Highly recommended.',
      date: '2026-05-19T10:30:00Z'
    }
  ] as Review[]
};

// Load or seed the data-store file
function loadDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      db = {
        products: parsed.products || [...DEFAULT_PRODUCTS],
        orders: parsed.orders || [],
        reviews: parsed.reviews || []
      };
      console.log('Database loaded successfully from file.');
    } else {
      saveDatabase();
      console.log('Database initialized and seeded.');
    }
  } catch (err) {
    console.error('Failed to load database. Using memory fallback.', err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database changes.', err);
  }
}

loadDatabase();

// Middleware
app.use(express.json());

// ==========================================
// API ENDPOINTS & LOGIC
// ==========================================

// -- GET Products with search, filtering and sorting
app.get('/api/products', (req, res) => {
  const { category, search, minPrice, maxPrice, sortBy } = req.query;
  let list = [...db.products];

  // Filters
  if (category && category !== 'All') {
    list = list.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  if (minPrice) {
    list = list.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    list = list.filter(p => p.price <= Number(maxPrice));
  }

  // Sorting
  if (sortBy === 'price-low-high') {
    list.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high-low') {
    list.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  }

  res.json(list);
});

// -- POST create a new product (Admin)
app.post('/api/products', (req, res) => {
  const { name, category, price, description, image, specifications, stock } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Missing required product fields (name, category, price)' });
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    category,
    price: Number(price),
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1571175432244-5f02c1d32a9a?auto=format&fit=crop&q=80&w=600',
    rating: 5,
    reviewsCount: 0,
    specifications: specifications || {},
    stock: stock !== undefined ? Number(stock) : 10
  };

  db.products.push(newProduct);
  saveDatabase();
  res.status(201).json(newProduct);
});

// -- PUT edit a product (Admin)
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, category, price, description, image, specifications, stock } = req.body;
  db.products[index] = {
    ...db.products[index],
    name: name !== undefined ? name : db.products[index].name,
    category: category !== undefined ? category : db.products[index].category,
    price: price !== undefined ? Number(price) : db.products[index].price,
    description: description !== undefined ? description : db.products[index].description,
    image: image !== undefined ? image : db.products[index].image,
    specifications: specifications !== undefined ? specifications : db.products[index].specifications,
    stock: stock !== undefined ? Number(stock) : db.products[index].stock
  };

  saveDatabase();
  res.json(db.products[index]);
});

// -- DELETE product (Admin)
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = db.products.length;
  db.products = db.products.filter(p => p.id !== id);
  if (db.products.length === initialLen) {
    return res.status(404).json({ error: 'Product not found' });
  }
  saveDatabase();
  res.json({ success: true, message: 'Product deleted' });
});

// -- GET orders
app.get('/api/orders', (req, res) => {
  res.json(db.orders);
});

// -- POST create an order (Checkout)
app.post('/api/orders', (req, res) => {
  const { customerName, customerEmail, shippingAddress, paymentMethod, items, totalAmount } = req.body;
  if (!customerName || !customerEmail || !items || !items.length) {
    return res.status(400).json({ error: 'Missing order information. Customer details and items array are required.' });
  }

  const newOrder: Order = {
    id: `ord-${1000 + db.orders.length + 1}`,
    customerName,
    customerEmail,
    shippingAddress,
    paymentMethod,
    items,
    totalAmount,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  // Decrement product stocks
  items.forEach((item: any) => {
    const prod = db.products.find(p => p.id === item.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
    }
  });

  db.orders.push(newOrder);
  saveDatabase();
  res.status(201).json(newOrder);
});

// -- PUT update order status (Admin)
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (!['Pending', 'Processing', 'Shipped', 'Delivered'].includes(status)) {
    return res.status(400).json({ error: 'Invalid order status value' });
  }

  order.status = status;
  saveDatabase();
  res.json(order);
});

// -- GET reviews for a product
app.get('/api/reviews/:productId', (req, res) => {
  const { productId } = req.params;
  const list = db.reviews.filter(r => r.productId === productId);
  res.json(list);
});

// -- POST add review for a product
app.post('/api/reviews', (req, res) => {
  const { productId, customerName, rating, comment } = req.body;
  if (!productId || !customerName || !rating || !comment) {
    return res.status(400).json({ error: 'Missing review elements' });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId,
    customerName,
    rating: Number(rating),
    comment,
    date: new Date().toISOString()
  };

  db.reviews.push(newReview);

  // Re-calculate average rating for product
  const productReviews = db.reviews.filter(r => r.productId === productId);
  const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
  const avg = Number((total / productReviews.length).toFixed(1));

  const prod = db.products.find(p => p.id === productId);
  if (prod) {
    prod.rating = avg;
    prod.reviewsCount = productReviews.length;
  }

  saveDatabase();
  res.status(201).json({ review: newReview, updatedProduct: prod });
});

// -- POST Gemini Chatbot/Recommendation Suggestion engine (Appliance Advisor)
app.post('/api/gemini/suggest', async (req, res) => {
  const { prompt, chatHistory } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'A user prompt/question is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Elegant fall-back smart rule-based guidance system if LLM key is not provided yet
    console.log('Gemini API key is unconfigured. Utilizing smart heuristic chatbot.');
    const q = prompt.toLowerCase();
    let reply = `Hello! I am your Home Appliance Smart Companion. (Note: Put your Gemini API key in AI Studio Secrets to unlock the smart LLM companion!) \n\nBased on our active inventory, here are some options: \n\n`;

    if (q.includes('fridge') || q.includes('refrigerator') || q.includes('cool') || q.includes('cold')) {
      const fridges = db.products.filter(p => p.category === 'Refrigerators');
      if (fridges.length) {
        reply += `### Refrigerators we suggest:\n`;
        fridges.forEach(f => {
          reply += `- **${f.name}** ($${f.price}): ${f.description}\n  *Specs:* Rating: ${f.rating}⭐, Capacity: ${f.specifications['Capacity'] || '350L'}.\n`;
        });
      } else {
        reply += `I couldn't find any refrigerators in the system right now. But we usually carry premium double door invertor series!`;
      }
    } else if (q.includes('wash') || q.includes('laundry') || q.includes('clothes') || q.includes('machine')) {
      const washers = db.products.filter(p => p.category === 'Washing Machines');
      if (washers.length) {
        reply += `### Washing Machines we suggest:\n`;
        washers.forEach(w => {
          reply += `- **${w.name}** ($${w.price}): ${w.description}\n  *Specs:* Speed: ${w.specifications['Spin Speed'] || '1400 RPM'}, Rating: ${w.rating}⭐.\n`;
        });
      } else {
        reply += `I couldn't find any washing machines in store. Try refreshing or standard front-loads.`;
      }
    } else if (q.includes('bake') || q.includes('microwave') || q.includes('oven') || q.includes('cook')) {
      const microwaves = db.products.filter(p => p.category === 'Microwaves');
      if (microwaves.length) {
        reply += `### Microwave Ovens we suggest:\n`;
        microwaves.forEach(m => {
          reply += `- **${m.name}** ($${m.price}): ${m.description}\n  *Specs:* Capacity: ${m.specifications['Capacity'] || '28L'}, Power: ${m.specifications['Max Power Output'] || '900W'}.\n`;
        });
      }
    } else if (q.includes('fan') || q.includes('wind') || q.includes('ceiling') || q.includes('cool')) {
      const fans = db.products.filter(p => p.category === 'Fans');
      if (fans.length) {
        reply += `### Fans we suggest:\n`;
        fans.forEach(f => {
          reply += `- **${f.name}** ($${f.price}): ${f.description}\n  *Specs:* Sweep: ${f.specifications['Sweep Size'] || '1200 mm'}, Rating: ${f.rating}⭐.\n`;
        });
      }
    } else {
      reply += `I can help you select refrigerators, washing machines, microwaves, fans, and cooling ACs. Let me know your family size, budget, or quiet operational needs!\n\nHere are some of our top sellers overall:\n`;
      db.products.slice(0, 3).forEach(p => {
        reply += `- **${p.name}** ($${p.price}) - Rated ${p.rating}⭐\n`;
      });
    }

    reply += `\n*Ask me about family size, quiet operation, or energy ratings to narrow down your choices!*`;
    return res.json({ text: reply });
  }

  // Gemini API exists! Let's build a smart query using @google/genai
  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Provide detailed product inventory context to the LLM
    const catalogueSummary = db.products.map(p => {
      return `ID: ${p.id}, Product: ${p.name}, Category: ${p.category}, Price: $${p.price}, Specs: ${JSON.stringify(p.specifications)}, Description: ${p.description}, Average Rating: ${p.rating} (based on ${p.reviewsCount} reviews). Stock: ${p.stock}`;
    }).join('\n');

    // Compile message history
    let prevHistoryString = '';
    if (chatHistory && Array.isArray(chatHistory)) {
      prevHistoryString = chatHistory.map((m: any) => `${m.sender === 'user' ? 'Customer' : 'Advisor Assistant'}: ${m.text}`).join('\n');
    }

    const systemContext = `
You are the Official "Home Appliance Smart Advisor" chatbot for the Home Appliances Shop e-commerce website.
You help customers browse, compare, and choose appliances based on family size, budget, features, and energy ratings.

Here is the entire current live inventory database schema and listings:
${catalogueSummary}

Guiding Instructions:
- Answer the customer's question directly.
- Recommend corresponding appliances from the active catalog listing. Mention their prices and high-level specifications (e.g., energy efficiency ratings, capacities).
- Avoid recommending any models or brands that are not listed in the catalogue above unless explicitly comparing with another standard model.
- Keep your tone friendly, helpful, objective, and expert.
- Format your response with clear markdown headings, bold terms, and descriptive item lists.
- Mention current ratings and review counts if helpful.
`;

    const fullPrompt = `${systemContext}\n\nChat History:\n${prevHistoryString}\nCustomer: ${prompt}\nAdvisor Assistant:`;

    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: fullPrompt
    });

    const responseText = result.text || 'I analyzed the options, but my generator had an empty response. Let me know which categories you are browsing!';
    res.json({ text: responseText });

  } catch (error: any) {
    console.error('Gemini API execution failure:', error);
    res.status(500).json({ error: 'Gemini request failed: ' + error.message });
  }
});

// ==========================================
// STATIC ASSET AND VITE ROUTER COMPATIBILITY
// ==========================================

async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HomeApplianceServer] Server listening on http://localhost:${PORT}`);
  });
}

setupServer();
