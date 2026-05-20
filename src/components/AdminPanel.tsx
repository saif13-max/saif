/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Shield, ShoppingBag, Folder, DollarSign, Star, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';
import { Product, Order } from '../types';

interface AdminPanelProps {
  ordersRefreshCount: number;
}

export default function AdminPanel({ ordersRefreshCount }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Form states for creating/editing product
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Refrigerators',
    price: '',
    description: '',
    image: '',
    stock: '',
    specsInput: '' // format: key:value, key:value
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Products
      const pRes = await fetch('/api/products');
      const pData = await pRes.json();
      setProducts(pData);

      // Orders
      const oRes = await fetch('/api/orders');
      const oData = await oRes.json();
      setOrders(oData);
    } catch (err) {
      console.error('Failed to grab backend data inside admin dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ordersRefreshCount, activeSubTab]);

  // Handle Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to remove this appliance listing?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Delete product failed', err);
    }
  };

  // Handle Order Status updates
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
      }
    } catch (err) {
      console.error('Failed updating order status', err);
    }
  };

  // Open modal for editing
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    const specsString = Object.entries(prod.specifications)
      .map(([key, value]) => `${key}:${value}`)
      .join('\n');

    setProductForm({
      name: prod.name,
      category: prod.category,
      price: String(prod.price),
      description: prod.description,
      image: prod.image,
      stock: String(prod.stock),
      specsInput: specsString
    });
    setIsProductModalOpen(true);
  };

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Refrigerators',
      price: '',
      description: '',
      image: '',
      stock: '10',
      specsInput: 'Capacity: 350 Litres\nEnergy Rating: 5 Star\nNoise Level: Silent Inverter'
    });
    setIsProductModalOpen(true);
  };

  // Submit Product modifications
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.category || !productForm.price) return;

    // Parse specifications
    const specifications: Record<string, string> = {};
    productForm.specsInput.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        specifications[parts[0].trim()] = parts[1].trim();
      }
    });

    const bodyData = {
      name: productForm.name,
      category: productForm.category,
      price: Number(productForm.price),
      description: productForm.description,
      image: productForm.image,
      stock: Number(productForm.stock),
      specifications
    };

    try {
      let res;
      if (editingProduct) {
        // Edit Mode
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
      } else {
        // Add Mode
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
      }

      if (res.ok) {
        setIsProductModalOpen(false);
        fetchData();
      } else {
        alert('Server processing error saving the product.');
      }
    } catch (err) {
      console.error('Error modifying database product record', err);
    }
  };

  // Dashboard Stats calculation
  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageRating = products.length ? Number((products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(2)) : 5;

  return (
    <div id="admin-panel-root" className="w-full max-w-7xl mx-auto px-4 py-8 font-sans">
      {/* Overview Metric Indicators Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 uppercase font-mono text-xs">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-gray-400 block font-sans text-[10px] font-bold tracking-wider">Gross Revenue Collected</span>
            <strong className="text-lg md:text-xl font-bold font-mono text-slate-900">${totalSales.toFixed(2)}</strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-gray-400 block font-sans text-[10px] font-bold tracking-wider">Total Sales Invoices</span>
            <strong className="text-lg md:text-xl font-bold font-mono text-slate-900">{orders.length} orders</strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-gray-400 block font-sans text-[10px] font-bold tracking-wider">Inventory Catalog Listings</span>
            <strong className="text-lg md:text-xl font-bold font-mono text-slate-900">{products.length} Products</strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Folder className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-gray-400 block font-sans text-[10px] font-bold tracking-wider">Aggregate Rating score</span>
            <strong className="text-lg md:text-xl font-bold font-mono text-slate-900">{averageRating} / 5.0</strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Star className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

      {/* Admin Operations Layout */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {/* Toggle Headings */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
          <div className="flex gap-2">
            <button
              id="btn-admin-subtab-products"
              onClick={() => setActiveSubTab('products')}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                activeSubTab === 'products'
                  ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] font-bold shadow-xs'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              Hardware Catalog Database
            </button>
            <button
              id="btn-admin-subtab-orders"
              onClick={() => setActiveSubTab('orders')}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                activeSubTab === 'orders'
                  ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] font-bold shadow-xs'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              Order Tracking System
            </button>
          </div>

          {activeSubTab === 'products' && (
            <button
              id="btn-admin-add-product"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Add Appliance Listing
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-gray-400 animate-pulse">
            Sychronizing administration dashboard tables context...
          </div>
        ) : activeSubTab === 'products' ? (
          // Products Inventory Board
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-xs text-gray-900 font-sans">
              <thead className="bg-slate-50 text-[10px] font-mono text-slate-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">Appliance Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Selling Price</th>
                  <th className="px-5 py-3 text-center">Remaining Stock</th>
                  <th className="px-5 py-3 text-center">Avg Rating</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-900 max-w-xs truncate">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover bg-slate-100"
                        />
                        <span className="font-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-medium">{p.category}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">${p.price}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        p.stock === 0 ? 'bg-red-100 text-red-800' : p.stock <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center font-mono">
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                        {p.rating}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                       <button
                         id={`btn-admin-edit-${p.id}`}
                         onClick={() => handleOpenEditModal(p)}
                         className="p-1.5 rounded-lg hover:bg-slate-100 text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
                         title="Edit specifications"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
                       <button
                         id={`btn-admin-delete-${p.id}`}
                         onClick={() => handleDeleteProduct(p.id)}
                         className="p-1.5 rounded-lg hover:bg-slate-100 text-red-500 hover:text-red-700 transition"
                         title="Remove product"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Invoices / Orders Table
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            {orders.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3 font-sans">
                <Shield className="w-12 h-12 text-slate-200 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No client orders recorded yet</p>
                <p className="text-xs text-slate-500">Perform standard checkouts inside customer catalog screens to test tracking updates!</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-gray-900 font-sans">
                <thead className="bg-slate-50 text-[10px] font-mono text-slate-500 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3">Order Invoice ID</th>
                    <th className="px-5 py-3">Customer Info</th>
                    <th className="px-5 py-3">Assigned Items</th>
                    <th className="px-5 py-3 text-right">Order Revenue</th>
                    <th className="px-5 py-3 text-center">Delivery Tracking Status</th>
                    <th className="px-5 py-3 text-right">Actions / Transition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(ord => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">{ord.id}</td>
                      <td className="px-5 py-3 space-y-1">
                        <strong className="text-slate-900 font-semibold block">{ord.customerName}</strong>
                        <span className="text-gray-400 font-mono text-[10px] block">{ord.customerEmail}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        <ul className="space-y-0.5 list-disc list-inside">
                          {ord.items.map((item, id) => (
                            <li key={id} className="truncate max-w-xs text-[11px]">
                              {item.productName} <strong>(x{item.quantity})</strong>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-extrabold text-slate-900">${ord.totalAmount}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                          ord.status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          ord.status === 'Processing' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                          ord.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <select
                          id={`select-admin-order-status-${ord.id}`}
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-gray-200 rounded text-[11px] font-mono font-semibold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* CREATE / EDIT PRODUCT SLIDEOVER MODAL */}
      {isProductModalOpen && (
        <div id="admin-product-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-1.5 uppercase font-mono text-blue-400 tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {editingProduct ? 'Update Inventory details' : 'Register New Appliance'}
              </h4>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Appliance Device Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dynamic Cold double-door Refrigerator (400L)"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-[#2563EB] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Product Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-4 py-2 text-xs text-slate-800 bg-slate-50 border border-gray-200 rounded-lg outline-none focus:border-[#2563EB] font-semibold"
                  >
                    <option value="Refrigerators">Refrigerators</option>
                    <option value="Washing Machines">Washing Machines</option>
                    <option value="Microwaves">Microwaves</option>
                    <option value="Fans">Fans</option>
                    <option value="Air Conditioners">Air Conditioners</option>
                    <option value="Kitchen Appliances">Kitchen Appliances</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Retail Price ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="299.99"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-[#2563EB] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Initial Stock count</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-[#2563EB] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Image asset URL</label>
                  <input
                    type="text"
                    placeholder="Unsplash direct image URL or folder reference"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-[#2563EB] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Detailed Specifications (Line format key:value)</label>
                <textarea
                  placeholder="Capacity: 400 Litres&#10;Inverter Tech: Smart DC&#10;Warranty: 5 Years"
                  rows={3}
                  value={productForm.specsInput}
                  onChange={(e) => setProductForm({ ...productForm, specsInput: e.target.value })}
                  className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-[#2563EB] outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Core Marketing Description</label>
                <textarea
                  placeholder="Describe electrical specifications and quiet cooling mechanisms of the appliance device..."
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-4 py-2 text-xs text-gray-900 bg-slate-50 border border-gray-200 focus:bg-white rounded-lg focus:border-[#2563EB] outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-gray-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save to Inventory Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
