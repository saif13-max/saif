/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Filter, Star, Check, Trash2, X, MessageSquare, Sparkles, Send, ShieldAlert, BadgeCheck } from 'lucide-react';
import { Product, CartItem, Review, ChatMessage } from '../types';

interface ShopLayoutProps {
  onOrderPlaced: () => void;
}

export default function ShopLayout({ onOrderPlaced }: ShopLayoutProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Checkout Wizards
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<number>(1);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [orderConfirmed, setOrderConfirmed] = useState<any>(null);

  // Reviews submission state
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [newReviewForm, setNewReviewForm] = useState({
    customerName: '',
    rating: 5,
    comment: ''
  });
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState<boolean>(false);

  // Chat Advisor state
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Hello! I am your Smart Appliance Advisor. Ask me anything! For example: "Suggest an energy efficient refrigerator for a family of 4", or "Which fan operates the quietest?"', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch products from backend express
  const fetchProducts = async () => {
    try {
      const url = `/api/products?category=${activeCategory}&search=${searchQuery}&maxPrice=${maxPrice}&sortBy=${sortBy}`;
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data);

      // Extract unique categories
      const allRes = await fetch('/api/products');
      const allData: Product[] = await allRes.json();
      const catList = ['All', ...Array.from(new Set(allData.map(p => p.category)))];
      setCategories(catList);
    } catch (err) {
      console.error('Failed to load products from Express', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeCategory, searchQuery, maxPrice, sortBy]);

  useEffect(() => {
    if (selectedProduct) {
      fetchReviews(selectedProduct.id);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatOpen]);

  const fetchReviews = async (productId: string) => {
    try {
      const res = await fetch(`/api/reviews/${productId}`);
      const data = await res.json();
      setReviewsList(data);
    } catch (err) {
      console.error('Failed fetching reviews for product', err);
    }
  };

  const handleAddToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const handleUpdateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item => item.product.id === productId ? { ...item, quantity: qty } : item));
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Handle Review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newReviewForm.customerName || !newReviewForm.comment) return;

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          customerName: newReviewForm.customerName,
          rating: Number(newReviewForm.rating),
          comment: newReviewForm.comment
        })
      });

      if (response.ok) {
        setReviewSubmitSuccess(true);
        // Reset reviews form
        setNewReviewForm({ customerName: '', rating: 5, comment: '' });
        // Refresh items and review lists
        await fetchReviews(selectedProduct.id);
        await fetchProducts();
        setTimeout(() => setReviewSubmitSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Error submitting review', err);
    }
  };

  // Chat Adviser with Gemini
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: chatPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatPrompt('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/gemini/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.text,
          chatHistory: chatHistory.map(h => ({ sender: h.sender, text: h.text }))
        })
      });

      const data = await response.json();
      const aiResponseText = data.text || 'I analyzed the catalogue, but there was an error processing system recommendations.';

      setChatHistory(prev => [...prev, {
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.error('Error contacting smart chatbot suggestion service', err);
      setChatHistory(prev => [...prev, {
        sender: 'ai',
        text: 'Sorry, I am facing temporary network configurations inside the fullstack routing paths. Reach out with refrigerators or washers requests!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Checkout submit order
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutStep < 3) {
      setCheckoutStep(prev => prev + 1);
      return;
    }

    try {
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: checkoutForm.name,
          customerEmail: checkoutForm.email,
          shippingAddress: `${checkoutForm.address}, ${checkoutForm.city}, ${checkoutForm.postalCode}`,
          paymentMethod: 'Credit Card (Simulated)',
          items: orderItems,
          totalAmount: Number(cartTotal.toFixed(2))
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        setOrderConfirmed(orderData);
        setCart([]); // Clear Cart
        onOrderPlaced(); // Refresh parent stats
      } else {
        alert('Order processing failed. Please verify stocks.');
      }
    } catch (err) {
      console.error('Failed to execute orders', err);
    }
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setCheckoutStep(1);
    setOrderConfirmed(null);
    setCheckoutForm({
      name: '', email: '', phone: '', address: '', city: '', postalCode: '', cardNumber: '', expiryDate: '', cvv: ''
    });
  };

  return (
    <div id="shop-root" className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Hero promo banner */}
      <div className="bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#0F172A] text-white rounded-3xl p-8 md:p-12 mb-10 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl transform translate-x-12 -translate-y-12"></div>
         <div className="relative z-10 max-w-lg space-y-4">
           <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider text-blue-100">
             Smart Inverter Series
           </span>
           <h1 className="text-3xl md:text-5xl font-bold font-sans tracking-tight leading-tight">
             Premium Appliances for Modern Living
           </h1>
           <p className="text-[#DBEAFE] text-sm md:text-base leading-relaxed">
             Experience next-generation cooling, dynamic direct-drive launders, and IoT remote fans configured to save electricity.
           </p>
           <div className="pt-2 flex flex-wrap gap-4">
             <button 
               onClick={() => {
                 setActiveCategory('Refrigerators');
                 const el = document.getElementById('catalog-grid-top');
                 if (el) el.scrollIntoView({ behavior: 'smooth' });
               }}
               className="px-5 py-2.5 rounded-xl bg-white text-[#2563EB] text-xs font-bold hover:bg-slate-50 transition-all font-sans shadow-sm cursor-pointer"
             >
               Browse Cooling
             </button>
             <button 
               onClick={() => setIsChatOpen(true)}
               className="px-5 py-2.5 rounded-xl bg-[#2563EB]/85 hover:bg-[#2563EB] border border-blue-400/20 text-xs font-bold transition-all font-sans flex items-center gap-2 cursor-pointer"
             >
               <Sparkles className="w-4 h-4 text-amber-300" />
               Ask Appliance Advisor
             </button>
           </div>
         </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div id="catalog-grid-top" className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs mb-8 space-y-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Inputs */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="input-shop-search"
              type="text"
              placeholder="Search appliances (e.g., refrigerator, silent, inverter fan)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0]/50 focus:bg-white text-sm text-[#0F172A] border border-[#E2E8F0] focus:border-[#2563EB] transition-all outline-none font-sans shadow-inner"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Price Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-500 font-sans">Max Price:</span>
              <input
                id="slider-price-filter"
                type="range"
                min="50"
                max="1000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-32 md:w-40 h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
              />
              <span className="text-xs font-mono font-bold text-[#0F172A] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-[#BFDBFE]">${maxPrice}</span>
            </div>

            {/* Sorting Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 font-sans">Sort By:</span>
              <select
                id="select-shop-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs bg-[#F1F5F9] border border-[#E2E8F0] hover:bg-[#E2E8F0]/30 text-[#0F172A] font-bold outline-none focus:border-[#2563EB]"
              >
                <option value="rating">Highest Rating</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Category Pill Tabs */}
        <div className="flex border-t border-gray-100 pt-4 overflow-x-auto gap-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              id={`btn-shop-category-${cat}`}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-sans font-bold transition-all whitespace-nowrap border cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] shadow-xs'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* CORE PRODUCTS GRID */}
      {products.length === 0 ? (
        <div className="bg-slate-50 border border-gray-100 rounded-2xl p-16 text-center space-y-4">
          <Filter className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No appliances match filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting criteria inputs, search keywords, or selecting another category to populate available e-commerce models.
          </p>
          <button
            onClick={() => {
              setActiveCategory('All');
              setSearchQuery('');
              setMaxPrice(1000);
            }}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold font-sans text-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((prod) => (
            <div 
              key={prod.id} 
              id={`shop-product-card-${prod.id}`}
              className="card overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              {/* Product Visual Container */}
              <div 
                onClick={() => setSelectedProduct(prod)}
                className="relative aspect-video bg-slate-100 overflow-hidden cursor-pointer group"
              >
                <img 
                  src={prod.image} 
                  alt={prod.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white font-mono text-[10px] font-bold rounded-lg uppercase tracking-wider">
                  {prod.category}
                </span>
                {prod.stock <= 5 && (
                  <span className="absolute top-3 right-3 px-2 bg-red-600 text-white font-sans text-[10px] font-bold rounded-lg py-1 shadow-sm">
                    Only {prod.stock} left
                  </span>
                )}
              </div>

              {/* Core Text Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold font-sans tracking-tight text-slate-900">${prod.price}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span className="text-xs font-bold text-slate-800 font-mono">{prod.rating}</span>
                      <span className="text-[10px] text-gray-400 font-sans">({prod.reviewsCount})</span>
                    </div>
                  </div>
                  <h3 
                    onClick={() => setSelectedProduct(prod)}
                    className="text-sm font-bold text-[#0F172A] hover:text-[#2563EB] cursor-pointer h-10 line-clamp-2 leading-tight font-sans"
                  >
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedProduct(prod)}
                    className="text-xs font-bold font-sans text-[#2563EB] hover:text-[#1D4ED8]"
                  >
                    Specifications & Reviews
                  </button>
                  <button
                    id={`btn-add-to-cart-${prod.id}`}
                    disabled={prod.stock === 0}
                    onClick={() => handleAddToCart(prod)}
                    className={`px-4 py-2 font-semibold text-xs rounded-xl font-sans flex items-center gap-1.5 transition-all ${
                      prod.stock === 0 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {prod.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FLOAT SHOPPING CART FLOATER TRIGGER */}
      {cart.length > 0 && (
        <button
          id="btn-cart-floater"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 left-6 z-40 bg-zinc-900 hover:bg-black text-white px-5 py-4 rounded-full shadow-2xl flex items-center gap-3 transition-transform scale-100 hover:scale-105"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-3.5 -right-3.5 bg-indigo-600 text-white font-mono text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-900">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <span className="text-xs font-bold font-sans uppercase tracking-wider">Checkout (${cartTotal.toFixed(2)})</span>
        </button>
      )}

      {/* SHOPPING CART SIDEOVER SHEET */}
      {isCartOpen && (
        <div id="shop-cart-modal" className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)} />

          <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-gray-100">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  Your Shopping Cart
                </h3>
                <button 
                  id="btn-close-cart"
                  onClick={() => setIsCartOpen(false)} 
                  className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-gray-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">Your cart is currently empty</p>
                    <p className="text-xs text-slate-500">Pick awesome appliance listings of refrigerators, fans or washers to start!</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl relative">
                      <div className="w-16 h-16 rounded-lg bg-white border border-gray-100 overflow-hidden shrink-0">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-1 py-0.5">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.product.name}</h4>
                        <span className="text-xs font-bold text-indigo-600 block">${item.product.price}</span>
                        
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <button 
                              onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs font-bold text-gray-500 hover:bg-slate-50"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono text-xs font-semibold text-slate-800">{item.quantity}</span>
                            <button 
                              disabled={item.quantity >= item.product.stock}
                              onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs font-bold text-gray-500 hover:bg-slate-50 disabled:text-slate-200"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.product.id)}
                            className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Checkout triggers */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-600">Subtotal Balance</span>
                    <strong className="text-xl font-bold font-mono text-slate-950">${cartTotal.toFixed(2)}</strong>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    *Taxes are computed accurately depending on your billing destination during final wizard calculations. Secure simulated checkout protocols apply.
                  </p>
                  <button
                    id="btn-begin-checkout"
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Proceed to Secure Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MULTI-STEP CHECKOUT PROTOCOL MODAL */}
      {isCheckoutOpen && (
        <div id="checkout-wizard-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            {/* Checkout Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold leading-none">Security Checkout Wizard</h3>
                <p className="text-[11px] text-slate-400 font-mono">Simulated Secure Database Transaction</p>
              </div>
              <button 
                id="btn-close-checkout"
                onClick={handleCloseCheckout} 
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderConfirmed ? (
              // ReceiptConfirmation view
              <div className="p-6 text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <BadgeCheck className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-gray-900">Order Placed Successfully!</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Your checkout process has logged order details directly into our Express database. Stocks representing your purchased appliances have decremented dynamically in your inventory listings!
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 text-left space-y-2 text-xs font-mono text-slate-800">
                  <div><strong>Transaction receipt:</strong> {orderConfirmed.id}</div>
                  <div><strong>Client contact:</strong> {orderConfirmed.customerName} ({orderConfirmed.customerEmail})</div>
                  <div><strong>Shipping parameters:</strong> {orderConfirmed.shippingAddress}</div>
                  <div><strong>Total Amount:</strong> ${orderConfirmed.totalAmount}</div>
                  <div><strong>Initial Status:</strong> <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-bold">{orderConfirmed.status}</span></div>
                </div>

                <button
                  onClick={handleCloseCheckout}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Return to Appliance Shop
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-6">
                {/* Progress Indicators */}
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-xs font-bold text-gray-400">
                  <span className={checkoutStep >= 1 ? 'text-indigo-600 font-bold' : ''}>1. Info</span>
                  <span className="text-slate-300">/</span>
                  <span className={checkoutStep >= 2 ? 'text-indigo-600 font-bold' : ''}>2. Shipping</span>
                  <span className="text-slate-300">/</span>
                  <span className={checkoutStep >= 3 ? 'text-indigo-600 font-bold' : ''}>3. Secure Payment</span>
                </div>

                {checkoutStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Customer Credentials</h4>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Customer Full Name</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        placeholder="e.g. Abdullah Saif"
                        className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Email Address</label>
                        <input
                          type="email"
                          required
                          value={checkoutForm.email}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                          placeholder="student@iub.edu.pk"
                          className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={checkoutForm.phone}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                          placeholder="+92 300 1234567"
                          className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Delivery Address parameters</h4>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Street Address</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.address}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                        placeholder="Bahawalpur Cantonment"
                        className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">City</label>
                        <input
                          type="text"
                          required
                          value={checkoutForm.city}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                          placeholder="Bahawalpur"
                          className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Postal Code</label>
                        <input
                          type="text"
                          required
                          value={checkoutForm.postalCode}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, postalCode: e.target.value })}
                          placeholder="63100"
                          className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-2">
                       <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                       <p className="font-sans leading-relaxed">
                         <strong>Developer sandboxed:</strong> Mock card values are safe. Feel free to type anything.
                       </p>
                    </div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Simulated payment details</h4>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Credit Card Number</label>
                      <input
                        type="text"
                        required
                        pattern="\d{16}"
                        maxLength={16}
                        value={checkoutForm.cardNumber}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, cardNumber: e.target.value.replace(/\D/g, '') })}
                        placeholder="4000123456789010 (16 digits)"
                        className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-indigo-500 outline-none font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Expiry Date</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          maxLength={5}
                          value={checkoutForm.expiryDate}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, expiryDate: e.target.value })}
                          className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">CVV Safety pin</label>
                        <input
                          type="password"
                          required
                          maxLength={3}
                          pattern="\d{3}"
                          value={checkoutForm.cvv}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, cvv: e.target.value.replace(/\D/g, '') })}
                          placeholder="123"
                          className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-indigo-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm pricing summary */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500 font-sans">Gross total: <strong className="text-slate-900 font-mono font-bold">${cartTotal.toFixed(2)}</strong></div>
                  <div className="flex gap-2">
                    {checkoutStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setCheckoutStep(prev => prev - 1)}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium font-sans"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold font-sans flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      {checkoutStep === 3 ? `Place Order: $${cartTotal.toFixed(2)}` : 'Continue'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* QUICK VIEW DETAILS, SPECS, AND SUBMIT WORKABLE REVIEWS MODAL */}
      {selectedProduct && (
        <div id="product-quickview-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/50 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-indigo-600 uppercase tracking-wider">
                {selectedProduct.category}
              </span>
              <button 
                id="btn-close-quickview"
                onClick={() => setSelectedProduct(null)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-100 overflow-hidden bg-slate-50 max-h-[220px]">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedProduct.name}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-slate-900">${selectedProduct.price}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedProduct.stock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700'
                    }`}>
                      {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock})` : 'Out of Stock'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    {selectedProduct.description}
                  </p>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="space-y-2">
                <strong className="text-xs uppercase tracking-wider font-bold text-slate-400 block border-b border-gray-100 pb-1">
                  Appliance specifications
                </strong>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(selectedProduct.specifications).map(([key, val]) => (
                    <div key={key} className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-xs">
                      <span className="text-gray-400 block font-normal text-[10px] uppercase font-mono">{key}</span>
                      <strong className="text-slate-800 font-sans">{val}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews listings Section */}
              <div className="space-y-4">
                <strong className="text-xs uppercase tracking-wider font-bold text-slate-400 block border-b border-gray-100 pb-1">
                  Customer reviews ({reviewsList.length})
                </strong>

                {reviewsList.length === 0 ? (
                  <p className="text-xs text-slate-400 font-sans">No reviews posted yet. Be the first to leave user ratings!</p>
                ) : (
                  <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                    {reviewsList.map(item => (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-800 font-semibold">{item.customerName}</strong>
                          <div className="flex items-center text-amber-500 font-mono text-[10px] font-bold">
                            <Star className="w-3 h-3 fill-current mr-0.5" />
                            {item.rating}
                          </div>
                        </div>
                        <p className="text-slate-600 italic font-sans">{item.comment}</p>
                        <span className="text-[9px] text-gray-400 block font-mono">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form to submit review */}
                <form onSubmit={handleReviewSubmit} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 relative">
                  {reviewSubmitSuccess && (
                    <div className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center p-4 animate-fade-in text-center z-10 border border-emerald-100 shadow-sm">
                      <span className="text-xs font-sans text-emerald-800 font-bold flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-400 fill-current" />
                        Rating published! Averaging product rating recalculated...
                      </span>
                    </div>
                  )}
                  <h4 className="text-xs font-bold text-slate-800 font-sans">Submit Product Rating Score</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={newReviewForm.customerName}
                      onChange={(e) => setNewReviewForm({ ...newReviewForm, customerName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs text-gray-900 bg-white border border-gray-200 focus:bg-white rounded-lg focus:border-indigo-500 outline-none"
                    />
                    <select
                      value={newReviewForm.rating}
                      onChange={(e) => setNewReviewForm({...newReviewForm, rating: Number(e.target.value)})}
                      className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 outline-none focus:border-indigo-500 font-semibold"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                      <option value="3">⭐⭐⭐ (3 Stars)</option>
                      <option value="2">⭐⭐ (2 Stars)</option>
                      <option value="1">⭐ (1 Star)</option>
                    </select>
                  </div>
                  <textarea
                    required
                    placeholder="Provide performance feedback (e.g., quiet compressor, high speed sweep, wattage)..."
                    value={newReviewForm.comment}
                    rows={2}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, comment: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs text-gray-900 bg-white border border-gray-200 focus:bg-white rounded-lg focus:border-indigo-500 outline-none"
                  />
                  <div className="text-right">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Submit Rating
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">Retail price: <strong>${selectedProduct.price}</strong></span>
              <button
                disabled={selectedProduct.stock === 0}
                onClick={() => {
                  handleAddToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition-all ${
                  selectedProduct.stock === 0 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs cursor-pointer'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTELLIGENT APPLIANCE ADVISOR AI BOT SLIDE-UP */}
      <div className="fixed bottom-6 right-6 z-40 font-sans">
        {isChatOpen ? (
          <div className="w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
            {/* Advisor Header */}
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <div>
                  <strong className="text-xs block leading-none">Smart Appliance Advisor</strong>
                  <span className="text-[9px] text-indigo-200 font-mono uppercase tracking-wider">Powered by Gemini AI</span>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="text-indigo-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {chatHistory.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-normal font-sans ${
                    m.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                  }`}>
                    {/* Render markdown support simply */}
                    <div className="whitespace-pre-wrap font-sans">
                      {m.text}
                    </div>
                  </div>
                  <span className="text-[8px] text-gray-400 font-mono mt-0.5 px-1">{m.timestamp}</span>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-[10px] text-indigo-500 font-mono pl-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  Gemini Flash is analyzing active catalogs specs...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Send Interface form */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-gray-200 flex items-center gap-2 bg-white">
              <input
                id="input-chat-prompt"
                type="text"
                placeholder="Ask about fan speeds, budgets, fridges..."
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-100 focus:bg-white border border-gray-200 focus:border-[#2563EB] outline-none font-sans shadow-inner"
              />
              <button
                type="submit"
                disabled={!chatPrompt.trim()}
                className="p-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:bg-slate-200 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <button
            id="btn-open-chatbot"
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-2xl flex items-center justify-center scale-100 hover:scale-105 transition-all group cursor-pointer"
          >
            <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-all" />
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 font-bold font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-white uppercase shadow-sm flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 fill-current" />
              AI
            </span>
          </button>
        )}
      </div>

    </div>
  );
}
