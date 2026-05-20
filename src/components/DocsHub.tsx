/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Database, Network, BookOpen, Terminal, ClipboardCheck, Clipboard, Play, CheckCircle } from 'lucide-react';
import { DbTable, ApiEndpoint } from '../types';

export default function DocsHub() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'database' | 'api' | 'guide'>('architecture');
  const [selectedTable, setSelectedTable] = useState<string>('products');
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);
  const [activeApiCallResult, setActiveApiCallResult] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // SQL tables structures for Home Appliance Shop
  const dbTables: DbTable[] = [
    {
      name: 'users',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'INT', constraints: 'AUTO_INCREMENT, PRIMARY KEY', description: 'Unique identifier for registered customers' },
        { name: 'full_name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Full legal name of the customer' },
        { name: 'email', type: 'VARCHAR(150)', constraints: 'NOT NULL, UNIQUE', description: 'Login email credential address' },
        { name: 'password', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Securely hashed customer password' },
        { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Dating when the customer registered' }
      ],
      sqlQuery: `CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
    },
    {
      name: 'products',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'INT', constraints: 'AUTO_INCREMENT, PRIMARY KEY', description: 'Unique identifier for appliance item' },
        { name: 'name', type: 'VARCHAR(155)', constraints: 'NOT NULL', description: 'Full marketing/commercial name' },
        { name: 'category', type: 'VARCHAR(75)', constraints: 'NOT NULL', description: 'Appliance category (e.g., Refrigerators, Fans)' },
        { name: 'price', type: 'DECIMAL(10, 2)', constraints: 'NOT NULL', description: 'Retail price tags of the product' },
        { name: 'description', type: 'TEXT', constraints: 'NULL', description: 'Appliance features, energy rating and details' },
        { name: 'image', type: 'VARCHAR(255)', constraints: 'NULL', description: 'Asset filename or Unsplash web reference' },
        { name: 'rating', type: 'DECIMAL(3, 2)', constraints: 'DEFAULT 5.00', description: 'Average star rating (1-5 scale)' },
        { name: 'reviews_count', type: 'INT', constraints: 'DEFAULT 0', description: 'Quantity of reviews given by customers' },
        { name: 'stock', type: 'INT', constraints: 'DEFAULT 10', description: 'Inventory stock level available for sales' },
        { name: 'specifications', type: 'JSON', constraints: 'NULL', description: 'JSON object of granular appliance specifications (e.g. wattage, capacity)' }
      ],
      sqlQuery: `CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(155) NOT NULL,
    category VARCHAR(75) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    rating DECIMAL(3, 2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    stock INT DEFAULT 10,
    specifications JSON
);`
    },
    {
      name: 'orders',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'INT', constraints: 'AUTO_INCREMENT, PRIMARY KEY', description: 'Unique identifier of purchase order' },
        { name: 'user_id', type: 'INT', constraints: 'NULL, FK -> users(id)', description: 'Billing account user linking' },
        { name: 'customer_name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Name of customer checkout contact' },
        { name: 'customer_email', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Email address of contact' },
        { name: 'shipping_address', type: 'TEXT', constraints: 'NOT NULL', description: 'Full delivery location address' },
        { name: 'payment_method', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Card / COD selection' },
        { name: 'total_amount', type: 'DECIMAL(10, 2)', constraints: 'NOT NULL', description: 'Total price of purchased cart' },
        { name: 'status', type: 'VARCHAR(50)', constraints: "DEFAULT 'Pending'", description: 'Order delivery status (Pending, Processing, Shipped, Delivered)' },
        { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Timestamp when placed' }
      ],
      sqlQuery: `CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);`
    },
    {
      name: 'order_items',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'INT', constraints: 'AUTO_INCREMENT, PRIMARY KEY', description: 'Unique order item row identifier' },
        { name: 'order_id', type: 'INT', constraints: 'NOT NULL, FK -> orders(id)', description: 'Order linking key' },
        { name: 'product_id', type: 'INT', constraints: 'NOT NULL, FK -> products(id)', description: 'Appliance purchased key' },
        { name: 'product_name', type: 'VARCHAR(155)', constraints: 'NOT NULL', description: 'Snapshot name of the product at checkout' },
        { name: 'price', type: 'DECIMAL(10, 2)', constraints: 'NOT NULL', description: 'Price per item at checkout' },
        { name: 'quantity', type: 'INT', constraints: 'NOT NULL', description: 'Quantity purchased' }
      ],
      sqlQuery: `CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(155) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);`
    },
    {
      name: 'reviews',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'INT', constraints: 'AUTO_INCREMENT, PRIMARY KEY', description: 'Unique review row' },
        { name: 'product_id', type: 'INT', constraints: 'NOT NULL, FK -> products(id)', description: 'Target appliance key' },
        { name: 'customer_name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Author of the review' },
        { name: 'rating', type: 'INT', constraints: 'NOT NULL', description: 'Star score rating from 1 to 5' },
        { name: 'comment', type: 'TEXT', constraints: 'NOT NULL', description: 'Detailed feedback from customer' },
        { name: 'date', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Timestamp given' }
      ],
      sqlQuery: `CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    rating INT NOT NULL,
    comment TEXT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);`
    }
  ];

  const apiEndpoints: ApiEndpoint[] = [
    {
      method: 'GET',
      path: '/api/products',
      description: 'Fetch and filter the entire home appliances inventory.',
      requestBody: 'Optional query parameters: category, search, minPrice, maxPrice, sortBy',
      responseBody: '[\n  {\n    "id": "prod-1",\n    "name": "Refrigerator ...",\n    "price": 699.99,\n    "category": "Refrigerators",\n    "specifications": { ... }\n  }\n]'
    },
    {
      method: 'POST',
      path: '/api/products',
      description: 'Create a new home appliance listing (Admin Authorized).',
      requestBody: '{\n  "name": "PowerClean Microwave",\n  "category": "Microwaves",\n  "price": 149.99,\n  "description": "...",\n  "stock": 10,\n  "specifications": { "Capacity": "20L" }\n}',
      responseBody: '{\n  "id": "prod-165842...",\n  "name": "PowerClean Microwave",\n  "category": "Microwaves",\n  "price": 149.99,\n  ...\n}'
    },
    {
      method: 'POST',
      path: '/api/orders',
      description: 'Process an order transaction and decrement catalog stock levels.',
      requestBody: '{\n  "customerName": "Abdullah Saif",\n  "customerEmail": "student@iub.edu.pk",\n  "shippingAddress": "Bahawalpur, Pakistan",\n  "paymentMethod": "Credit Card",\n  "items": [\n    { "productId": "prod-1", "productName": "...", "price": 699.99, "quantity": 1 }\n  ],\n  "totalAmount": 699.99\n}',
      responseBody: '{\n  "id": "ord-1001",\n  "customerName": "Abdullah Saif",\n  "status": "Pending",\n  "totalAmount": 699.99,\n  "createdAt": "2026-05-20T..."\n}'
    },
    {
      method: 'POST',
      path: '/api/reviews',
      description: 'Submit an appliance product review rating and update average star scoring.',
      requestBody: '{\n  "productId": "prod-1",\n  "customerName": "Maam Asma Hameed",\n  "rating": 5,\n  "comment": "Exceptional energy saving performance!"\n}',
      responseBody: '{\n  "review": { "id": "rev-999", "productId": "prod-1", ... },\n  "updatedProduct": { "id": "prod-1", "rating": 4.9, "reviewsCount": 43, ... }\n}'
    },
    {
      method: 'POST',
      path: '/api/gemini/suggest',
      description: 'Generates intelligent appliance comparison suggestions using server-side Gemini 3.5 Flash context.',
      requestBody: '{\n  "prompt": "Recommend a silent refrigerator fitted with smart inverter compressor technology for a small family.",\n  "chatHistory": []\n}',
      responseBody: '{\n  "text": "Based on our active catalog, I highly recommend the **Smart inverter Double-Door Refrigerator (350L)** ($699.99). It operates at an ultra-quiet 32 dB noise level..."\n}'
    }
  ];

  const handleCopySql = (query: string) => {
    navigator.clipboard.writeText(query);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const handleTestApi = async (endpoint: ApiEndpoint) => {
    setApiLoading(true);
    setActiveApiCallResult(null);
    try {
      let url = `${endpoint.path}`;
      let options: RequestInit = { method: endpoint.method };

      if (endpoint.method === 'GET') {
        // Add default query parameters for listing
        url += '?category=All&sortBy=rating';
      } else {
        options.headers = { 'Content-Type': 'application/json' };
        // Create matching mock body based on endpoint description
        if (endpoint.path.includes('suggest')) {
          options.body = JSON.stringify({ prompt: 'Tell me about energy-saving washing machines.', chatHistory: [] });
        } else if (endpoint.path.includes('reviews')) {
          options.body = JSON.stringify({ productId: 'prod-1', customerName: 'Student Tester', rating: 5, comment: 'Exceptional test review!' });
        } else if (endpoint.path.includes('products')) {
          options.body = JSON.stringify({ name: 'Smart Blender X4', category: 'Kitchen Appliances', price: 99.99, description: 'High power motor system.', stock: 15 });
        } else if (endpoint.path.includes('orders')) {
          options.body = JSON.stringify({
            customerName: 'Tester Saif',
            customerEmail: 'test@iub.edu.pk',
            shippingAddress: 'IUB Campus, Bahawalpur',
            paymentMethod: 'Cash On Delivery',
            items: [{ productId: 'prod-4', productName: 'WindStream High-Speed Smart Ceiling Fan', price: 89.99, quantity: 1 }],
            totalAmount: 89.99
          });
        }
      }

      const res = await fetch(url, options);
      const data = await res.json();
      setActiveApiCallResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setActiveApiCallResult(`Error executing request:\n${err.message}`);
    } finally {
      setApiLoading(false);
    }
  };

  const tableObj = dbTables.find(t => t.name === selectedTable) || dbTables[0];

  return (
    <div id="docs-hub-root" className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Student Metadata Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 mb-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-30 transform translate-x-12 -translate-y-12"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-mono rounded-full border border-amber-500/20">
              🎓 Academic Term Project Reference
            </span>
            <h1 className="text-2xl md:text-3xl font-bold font-sans tracking-tight">Home Appliances Shop</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Constructed dynamically for <strong>The Islamia University of Bahawalpur</strong>. Designed for the evaluation of <strong>Maam Asma Hameed</strong>.
            </p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 text-xs font-mono divide-y divide-slate-700">
            <div className="pb-2"><strong>Submitted By:</strong> Abdullah Saif</div>
            <div className="py-2"><strong>ID Ref:</strong> S23NDOCS1M01075</div>
            <div className="pt-2 text-slate-400">Evaluation Prototype v2.5</div>
          </div>
        </div>
      </div>

      {/* Main Mode Toggles */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto gap-2">
        <button
          id="btn-tab-arch"
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-5 py-3 hover:text-slate-900 font-bold text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'architecture' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500'
          }`}
        >
          <Network className="w-4 h-4" />
          System Architecture
        </button>
        <button
          id="btn-tab-db"
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-5 py-3 hover:text-slate-900 font-bold text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'database' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500'
          }`}
        >
          <Database className="w-4 h-4" />
          Database Schema (MySQL)
        </button>
        <button
          id="btn-tab-api"
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-5 py-3 hover:text-slate-900 font-bold text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'api' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Express API Endpoints
        </button>
        <button
          id="btn-tab-guide"
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-5 py-3 hover:text-slate-900 font-bold text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'guide' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Implementation Guide
        </button>
      </div>

      {/* ARCHITECTURE VIEW */}
      {activeTab === 'architecture' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Visual Architecture Schematic */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>Core Full-Stack Structural Diagram</span>
                <span className="text-xs font-mono font-normal text-gray-400">(Interactive Diagram)</span>
              </h2>
              <p className="text-xs text-slate-500 mb-6 font-sans">
                Click on the core nodes in the architectural landscape below to view technical protocol details, data formats, and structural mappings.
              </p>

              {/* Interactive SVG Diagram */}
              <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 flex items-center justify-center overflow-x-auto min-h-[380px]">
                <svg viewBox="0 0 740 380" className="w-full max-w-[700px] h-auto">
                  {/* Grid background */}
                  <defs>
                    <pattern id="archGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="20" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="0" x2="0" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#archGrid)" rx="8" />

                  {/* Node 1: User Client Browser */}
                  <g 
                    onClick={() => setActiveNode('client')}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="40" y="140" width="140" height="80" rx="10" 
                      fill={activeNode === 'client' ? '#e0e7ff' : '#ffffff'} 
                      stroke={activeNode === 'client' ? '#4f46e5' : '#e2e8f0'} 
                      strokeWidth="2"
                    />
                    <text x="110" y="175" textAnchor="middle" className="font-sans font-bold text-sm" fill="#1e293b">Client Browser</text>
                    <text x="110" y="195" textAnchor="middle" className="font-sans text-xs" fill="#64748b">React 19 + Tailwind</text>
                  </g>

                  {/* Arrow 1: Browser to Server REST / JSON */}
                  <path d="M 180 165 L 290 165" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                  <path d="M 290 195 L 180 195" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" fill="none" markerEnd="url(#arrow)" />
                  <text x="235" y="150" textAnchor="middle" className="font-mono text-[10px]" fill="#475569">REST APIs (JSON)</text>
                  <text x="235" y="215" textAnchor="middle" className="font-mono text-[10px]" fill="#475569">Vite Assets</text>

                  {/* Node 2: Express Server Middleware */}
                  <g 
                    onClick={() => setActiveNode('server')}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="300" y="110" width="160" height="140" rx="10" 
                      fill={activeNode === 'server' ? '#e0e7ff' : '#ffffff'} 
                      stroke={activeNode === 'server' ? '#4f46e5' : '#e2e8f0'} 
                      strokeWidth="2"
                    />
                    <text x="380" y="145" textAnchor="middle" className="font-sans font-bold text-sm" fill="#1e293b">Express Backend</text>
                    <text x="380" y="165" textAnchor="middle" className="font-mono text-[11px]" fill="#4f46e5">port: 3000</text>
                    <text x="380" y="195" textAnchor="middle" className="font-sans text-xs" fill="#475569">API Routing</text>
                    <text x="380" y="215" textAnchor="middle" className="font-sans text-[11px]" fill="#64748b">Vite SPA Handler</text>
                  </g>

                  {/* Arrow 2: Server to db (JSON file acting as MySQL) */}
                  <path d="M 460 160 L 570 120" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                  <path d="M 570 135 L 460 175" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                  <text x="515" y="130" textAnchor="middle" className="font-mono text-[10px] transform rotate-[-15deg]" fill="#475569">FS-write/read</text>

                  {/* Arrow 3: Server to LLM Gemini API */}
                  <path d="M 460 210 L 570 250" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                  <path d="M 570 265 L 460 225" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                  <text x="515" y="255" textAnchor="middle" className="font-mono text-[10px] transform rotate-[15deg]" fill="#475569">Secure proxy HTTPS</text>

                  {/* Node 3: Database (MySQL / Data-Store) */}
                  <g 
                    onClick={() => setActiveNode('database')}
                    className="cursor-pointer"
                  >
                    <rect 
                      x="580" y="70" width="130" height="90" rx="10" 
                      fill={activeNode === 'database' ? '#e0e7ff' : '#ffffff'} 
                      stroke={activeNode === 'database' ? '#4f46e5' : '#e2e8f0'} 
                      strokeWidth="2"
                    />
                    <text x="645" y="105" textAnchor="middle" className="font-sans font-bold text-sm" fill="#1e293b">Database</text>
                    <text x="645" y="125" textAnchor="middle" className="font-sans text-xs text-indigo-600 font-medium" fill="#4f46e5">data-store.json</text>
                    <text x="645" y="140" textAnchor="middle" className="font-mono text-[9px]" fill="#64748b">(MySQL Schema Map)</text>
                  </g>

                  {/* Node 4: Gemini LLM service */}
                  <g 
                    onClick={() => setActiveNode('gemini')}
                    className="cursor-pointer"
                  >
                    <rect 
                      x="580" y="210" width="130" height="95" rx="10" 
                      fill={activeNode === 'gemini' ? '#e0e7ff' : '#ffffff'} 
                      stroke={activeNode === 'gemini' ? '#4f46e5' : '#e2e8f0'} 
                      strokeWidth="2"
                    />
                    <text x="645" y="245" textAnchor="middle" className="font-sans font-bold text-sm" fill="#1e293b">Gemini AI Model</text>
                    <text x="645" y="265" textAnchor="middle" className="font-sans text-xs text-indigo-600 font-medium" fill="#4f46e5">gemini-3.5-flash</text>
                    <text x="645" y="280" textAnchor="middle" className="font-sans text-[10px]" fill="#64748b">Server-Side SDK</text>
                  </g>

                  {/* Definitions for arrow markers */}
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Explanatory Node Card */}
            <div className="bg-slate-50 rounded-2xl border border-gray-100 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-medium text-indigo-600 tracking-wider uppercase block mb-2">
                  Node Analysis Detail
                </span>
                {activeNode === null ? (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-gray-900">Choose a components node</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Click any component inside the diagram (Client, Express Backend, Database, or Gemini AI) to see real, production-ready fullstack details, including:
                    </p>
                    <ul className="space-y-2 text-xs text-gray-600 font-sans list-disc list-inside">
                      <li>Communications protocols used</li>
                      <li>Data structure schemas mapping</li>
                      <li>Detailed port structures definitions</li>
                      <li>Academic design justification</li>
                    </ul>
                  </div>
                ) : activeNode === 'client' ? (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-lg font-bold text-gray-900">Client Web Application</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Acts as the primary view. Reconstructed using React 19 SPA. Styles utilize highly fluid <strong>Tailwind CSS</strong>, with animations powered by <strong>motion/react</strong>.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-gray-200 text-xs font-mono">
                      <strong>Payload sent:</strong> JSON payloads containing checkout addresses, review scores, standard search keywords.
                    </div>
                  </div>
                ) : activeNode === 'server' ? (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-lg font-bold text-gray-900">Express Web App Server</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      A central full-stack router responding on port <code>3000</code>. Standard API endpoints are isolated from assets. Proxies secure secrets safe from Client disclosure.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-gray-200 text-xs font-mono">
                      <strong>Server Technology:</strong> Node.js + Express. Handles routing, session schema mapping, and CORS isolation.
                    </div>
                  </div>
                ) : activeNode === 'database' ? (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-lg font-bold text-gray-900">MySQL Database Mapper</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      In production, Express points to a standard MySQL database via XAMPP. For our sandbox preview, schema writes map to the <code>data-store.json</code> transactional engine.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-gray-200 text-xs font-mono text-indigo-600">
                      Standard MySQL scripts maps: Users, Products, Reviews, Orders, and Order Items.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-lg font-bold text-gray-900">Gemini LLM Integration</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Leverages server-side <code>@google/genai</code> SDK using model <code>gemini-3.5-flash</code>. Generates custom suggestions for client appliance filters.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-gray-200 text-xs font-mono">
                      <strong>Headers set:</strong> <code>User-Agent: aistudio-build</code>. Exposes zero client-side keys.
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-100 mt-6">
                <div className="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <Terminal className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <p className="text-xs text-indigo-800 leading-normal font-sans">
                    <strong>Architectural Note:</strong> Securing the checkout mechanism requires segregating administrative endpoints and database controllers entirely behind the Express layer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Design Flow of Checkout Protocol */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
              Secure Checkout & Order Placement Process Flow
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              <div className="relative p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="absolute -top-3 -left-2 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shadow-md">1</span>
                <strong className="text-xs font-sans text-slate-900 block pt-1">Cart validation</strong>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  The client compiles active cart listings and computes total balances locally before validating stocks on backend inventories.
                </p>
              </div>
              <div className="relative p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="absolute -top-3 -left-2 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shadow-md">2</span>
                <strong className="text-xs font-sans text-slate-900 block pt-1">Compile details</strong>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  The customer appends shipping address records, payment card indicators (SIM), and verification emails inside checkout structures.
                </p>
              </div>
              <div className="relative p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="absolute -top-3 -left-2 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shadow-md">3</span>
                <strong className="text-xs font-sans text-slate-900 block pt-1">Atomic Transaction</strong>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  The Express API validates balances, registers order details to db, decrements available catalog stock values, and registers initial tracking.
                </p>
              </div>
              <div className="relative p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="absolute -top-3 -left-2 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shadow-md">4</span>
                <strong className="text-xs font-sans text-slate-900 block pt-1">Response & Render</strong>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Returns tracking IDs immediately to the client to render receipt confirmations. Triggers invoice notifications and empties customer cart.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DATABASE SCHEMA VIEW */}
      {activeTab === 'database' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  Relational Tables & MySQL queries
                </h2>
                <p className="text-slate-500 text-xs font-sans">
                  Select a table below to explore its columns array structure, indexes metadata, and generate standard MySQL creation syntax.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {dbTables.map(t => (
                  <button
                    key={t.name}
                    id={`btn-table-${t.name}`}
                    onClick={() => setSelectedTable(t.name)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium font-mono border transition-all ${
                      selectedTable === t.name
                        ? 'bg-[#2563EB] text-white border-[#2563EB] hover:bg-[#1D4ED8] font-bold shadow-xs cursor-pointer'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Columns Table */}
              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Table Columns mapping: <strong>{tableObj.name}</strong>
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs text-gray-900">
                    <thead className="bg-slate-50 text-[11px] font-mono text-slate-500 uppercase border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Column Name</th>
                        <th className="px-4 py-3">DataType</th>
                        <th className="px-4 py-3">Constraints / Keys</th>
                        <th className="px-4 py-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {tableObj.columns.map(col => (
                        <tr key={col.name} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-bold text-indigo-600">{col.name}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{col.type}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono ${
                              col.constraints.includes('PRIMARY KEY')
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : col.constraints.includes('FK')
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {col.constraints}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-xs">{col.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Generated SQL DDL */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                    MySQL Query Statement
                  </h3>
                  <button
                    id="btn-copy-sql"
                    onClick={() => handleCopySql(tableObj.sqlQuery)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors text-xs text-slate-700 font-sans font-medium"
                  >
                    {sqlCopied ? (
                      <>
                        <ClipboardCheck className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-600 text-[11px]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy SQL Schema</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-auto max-h-[300px]">
                  <pre className="text-xs font-mono text-emerald-400 leading-normal">
                    {tableObj.sqlQuery}
                  </pre>
                </div>
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-800 font-sans space-y-1">
                  <strong>ℹ️ Relational Integrity Rules:</strong>
                  <p>
                    Deleting an order recursively removes all its items from <code>order_items</code> via <code>ON DELETE CASCADE</code>, but trying to delete products ordered will stop at <code>ON DELETE RESTRICT</code> constraints to prevent historical order corruption.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API DOCUMENTATION & LIVE TESTS */}
      {activeTab === 'api' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              Interactive Express Endpoint Specs
            </h2>
            <p className="text-slate-500 text-xs font-sans mb-6">
              This interactive dashboard connects directly to our Node/Express backend on port <code>3000</code>. Press "Try API" next to any endpoint description to fetch live datastorage records.
            </p>

            <div className="space-y-6">
              {apiEndpoints.map((ep, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Endpoint Row */}
                  <div className="bg-slate-50 p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-3 py-1 text-xs font-mono font-bold rounded-md ${
                        ep.method === 'GET' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        ep.method === 'POST' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        ep.method === 'PUT' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-xs font-mono font-bold text-slate-800">{ep.path}</code>
                    </div>
                    <div className="text-xs text-slate-600 font-sans">
                      {ep.description}
                    </div>
                    <button
                      id={`btn-test-api-${idx}`}
                      onClick={() => handleTestApi(ep)}
                      className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs font-sans flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Try API Endpoint
                    </button>
                  </div>

                  {/* Body Configurations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 text-xs font-mono">
                    <div className="p-4 border-r border-gray-200 bg-white">
                      <strong className="text-[10px] text-gray-400 block mb-2 uppercase tracking-wider font-sans">Request Body / Queries parameters</strong>
                      <pre className="text-slate-600 overflow-x-auto whitespace-pre-wrap">
                        {ep.requestBody || 'No parameters required.'}
                      </pre>
                    </div>
                    <div className="p-4 bg-slate-50">
                      <strong className="text-[10px] text-gray-400 block mb-2 uppercase tracking-wider font-sans">Standard Mock Response Definition</strong>
                      <pre className="text-slate-600 overflow-x-auto whitespace-pre-wrap">
                        {ep.responseBody}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active API response box */}
          {(apiLoading || activeApiCallResult) && (
            <div className="bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl p-6 shadow-lg animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="flex items-center gap-2 text-xs font-mono">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Live Express Execution Sandbox Terminal Console
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                  {apiLoading ? 'fetching...' : '200 OK'}
                </span>
              </div>
              {apiLoading ? (
                <div className="text-xs font-mono animate-pulse text-emerald-500">
                  Executing HTTP client stream against port 3000 router...
                </div>
              ) : (
                <pre className="text-xs font-mono overflow-auto max-h-[350px] whitespace-pre-wrap text-emerald-300">
                  {activeApiCallResult}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* COMPREHENSIVE GUIDE VIEW */}
      {activeTab === 'guide' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in font-sans">
          {/* Main Content Guides */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Local Server Deployment (XAMPP / PHP + MySQL) Guide
              </h2>
              <p className="text-sm text-slate-600 leading-normal">
                If preparing to run this project offline for your university project evaluation with <strong>Maam Asma Hameed</strong> using XAMPP, follow these step-by-step instructions:
              </p>

              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <strong className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-slate-200 text-slate-800 w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                    Run XAMPP Control Panel
                  </strong>
                  <p className="text-xs text-slate-600 leading-normal pl-7">
                    Open XAMPP on your desktop. Click <strong>Start</strong> beside <strong>Apache</strong> to run the local HTTP website server, and <strong>MySQL</strong> to launch your database engine.
                  </p>
                </div>

                <div className="space-y-2">
                  <strong className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-slate-200 text-slate-800 w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                    Import the database schema MySQL
                  </strong>
                  <p className="text-xs text-slate-600 leading-normal pl-7">
                    Open your web browser and navigate to <code>http://localhost/phpmyadmin</code>. Click "New" inside the left panel to create a database. Type <code>home_appliances_db</code> and select "Create". Click on the SQL tab at the top section, copy-paste our <strong>MySQL table query script</strong>, and execute it!
                  </p>
                </div>

                <div className="space-y-2">
                  <strong className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-slate-200 text-slate-800 w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                    Establish PHP Database Connection Configuration
                  </strong>
                  <div className="pl-7 space-y-2">
                    <p className="text-xs text-slate-600 leading-normal">
                      Create and place a database linkage helper script called <code>db_connect.php</code> inside your <code>htdocs/appliances_shop/api/</code> directory:
                    </p>
                    <div className="bg-slate-900 text-emerald-400 rounded-lg p-3 overflow-auto">
                      <pre className="text-[10px] font-mono leading-normal">
{`<?php
// PHP database connection config
$host = "localhost";
$username = "root";
$password = "";
$dbname = "home_appliances_db";

$conn = new mysqli($host, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <strong className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-slate-200 text-slate-800 w-5 h-5 rounded-full flex items-center justify-center text-xs">4</span>
                    Querying Products on Product Listing Page (PHP Code Template)
                  </strong>
                  <div className="pl-7 space-y-2">
                    <p className="text-xs text-slate-600 leading-normal">
                      Retrieve products from the database and output them in a list style inside <code>get_products.php</code>:
                    </p>
                    <div className="bg-slate-900 text-emerald-400 rounded-lg p-3 overflow-auto">
                      <pre className="text-[10px] font-mono leading-normal">
{`<?php
header("Content-Type: application/json");
require_once "db_connect.php";

$category = isset($_GET['category']) ? $_GET['category'] : 'All';
$sql = "SELECT * FROM products";

if ($category !== 'All') {
    $category = $conn->real_escape_string($category);
    $sql .= " WHERE category = '$category'";
}

$result = $conn->query($sql);
$products = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // Decode specifications from JSON field
        $row['specifications'] = json_decode($row['specifications']);
        $products[] = $row;
    }
}

echo json_encode($products);
$conn->close();
?>`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Directory Map and Tips */}
          <div className="space-y-6">
            {/* Visual Directory Mapper */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase font-sans tracking-wider text-slate-400 block pb-1 border-b border-gray-100">
                Project Code Folder File Map
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal font-sans">
                Below shows structural recommended directory mappings layout for full e-commerce shop implementation.
              </p>
              <div className="font-mono text-[11px] text-indigo-950 p-4 bg-indigo-50/50 rounded-xl space-y-1.5 overflow-x-auto">
                <div>📁 Home-Appliances-Shop-Root/</div>
                <div className="pl-4">📁 api/ <span className="text-slate-500 text-[10px] font-sans">(PHP Backend Controllers)</span></div>
                <div className="pl-8">📄 db_connect.php</div>
                <div className="pl-8">📄 get_products.php</div>
                <div className="pl-8">📄 place_order.php</div>
                <div className="pl-8">📄 get_reviews.php</div>
                <div className="pl-4">📁 css/</div>
                <div className="pl-8">📄 styles.css <span className="text-slate-500 text-[10px] font-sans">(Custom page layout rules)</span></div>
                <div className="pl-4">📁 js/</div>
                <div className="pl-8">📄 main.js <span className="text-slate-500 text-[10px] font-sans">(Cart rendering state logic)</span></div>
                <div className="pl-8">📄 cart.js <span className="text-slate-500 text-[10px] font-sans">(Local storage checkout calculations)</span></div>
                <div className="pl-4">📁 admin/</div>
                <div className="pl-8">📄 index.php <span className="text-slate-500 text-[10px] font-sans">(Admin console controllers)</span></div>
                <div className="pl-8">📄 manage_products.php</div>
                <div className="pl-4">📄 index.html <span className="text-slate-500 text-[10px] font-sans">(Primary storefront mockup framework)</span></div>
                <div className="pl-4">📄 sql_schema.sql <span className="text-slate-500 text-[10px] font-sans">(MySQL startup scripts)</span></div>
              </div>
            </div>

            {/* Evaluation Score Card Guide */}
            <div className="bg-slate-950 text-white rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase font-sans tracking-wider text-amber-500 block">
                ⭐ Evaluation Score Optimization
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                To maximize your final score on project evaluation by <strong>Maam Asma Hameed</strong>, emphasize these architectural details:
              </p>
              <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside font-sans">
                <li>Demonstrate how stock decreases sequentially upon order execution.</li>
                <li>Show how the ratings adjust automatically when a user posts new star ratings feedback.</li>
                <li>Explain how the parameters inside <code>json_encode()</code> prevent encoding faults in PHP.</li>
                <li>Double check that SQL databases are structured beautifully using standard Relational Primary-Foreign key constraints!</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
