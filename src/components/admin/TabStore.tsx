import React, { useState, useEffect } from 'react';
import { storeService } from '../../services/storeService';
import { Product, StoreOrder, StoreSettings, OrderStatus } from '../../types';
import { Package, ShoppingBag, Settings, Plus, Edit, Trash2, Save, X, Search, Filter, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { TabsContent } from '../ui/tabs';
import { toast } from 'sonner';
import { generateInvoicePDF, PDFInvoiceData } from '../../utils/pdfGenerator';

type Tab = 'products' | 'orders' | 'settings';

export default function TabStore() {
  const [activeTab, setActiveTab] = useState<Tab>('products');

  return (
    <TabsContent value="store" className="m-0">
      <div className="space-y-6">
        <div className="flex gap-4 border-b border-gray-100 pb-4 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'products' ? 'bg-navy text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Package size={16} /> Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'orders' ? 'bg-navy text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <ShoppingBag size={16} /> Orders
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-navy text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Settings size={16} /> Settings
          </button>
        </div>

        <div className="mt-6">
          {activeTab === 'products' && <StoreProducts />}
          {activeTab === 'orders' && <StoreOrders />}
          {activeTab === 'settings' && <StoreSettingsManager />}
        </div>
      </div>
    </TabsContent>
  );
}

function StoreProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await storeService.getProducts();
      setProducts(data);
    } catch (error: any) {
      console.error("fetchProducts error:", error);
      toast.error('Failed to load products: ' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setDescription(product.description);
      setPrice(product.price);
      setOriginalPrice(product.originalPrice || '');
      setCategory(product.category);
      setImageUrl(product.images?.[0] || '');
      setInStock(product.inStock);
      setIsActive(product.isActive);
    } else {
      setEditingProduct(null);
      setName('');
      setDescription('');
      setPrice(0);
      setOriginalPrice('');
      setCategory('');
      setImageUrl('');
      setInStock(true);
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !category || price <= 0) {
      toast.error('Please fill required fields (Name, Category, Price)');
      return;
    }

    try {
      const pData: any = {
        name,
        description,
        price: Number(price),
        category,
        images: imageUrl ? [imageUrl] : [],
        inStock,
        isActive,
        createdAt: editingProduct?.createdAt || new Date().toISOString()
      };

      if (originalPrice) {
        pData.originalPrice = Number(originalPrice);
      }

      // Remove any remaining undefined fields to be safe
      Object.keys(pData).forEach(key => pData[key] === undefined && delete pData[key]);

      if (editingProduct) {
        await storeService.updateProduct(editingProduct.id, pData);
        toast.success('Product updated');
      } else {
        await storeService.addProduct(pData as any);
        toast.success('Product added');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error?.message || 'Error saving product');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await storeService.deleteProduct(id);
        toast.success('Product deleted');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-navy">Manage Products</h3>
        <Button onClick={() => openModal()} className="bg-teal text-white rounded-xl flex items-center gap-2">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-8 h-8 m-4 text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-navy truncate">{p.name}</h4>
              <p className="text-sm text-gray-500">{p.category} • ₹{p.price}</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {p.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                </span>
                {!p.isActive && <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600">INACTIVE</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => openModal(p)} className="p-2 bg-gray-50 rounded-lg text-teal hover:bg-teal hover:text-white transition-colors">
                <Edit size={16} />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-navy">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Product Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mt-1 outline-none focus:ring-2 ring-teal" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Category *</label>
                  <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mt-1 outline-none focus:ring-2 ring-teal" placeholder="e.g. Copper Pipe" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Price (₹) *</label>
                  <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full p-3 bg-gray-50 rounded-xl mt-1 outline-none focus:ring-2 ring-teal" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Original Price (₹) [Optional]</label>
                <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value ? Number(e.target.value) : '')} className="w-full p-3 bg-gray-50 rounded-xl mt-1 outline-none focus:ring-2 ring-teal" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Image URL</label>
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mt-1 outline-none focus:ring-2 ring-teal" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mt-1 outline-none focus:ring-2 ring-teal h-24 resize-none" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="w-5 h-5 accent-teal" />
                  <span className="font-bold text-sm text-navy">In Stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-5 h-5 accent-teal" />
                  <span className="font-bold text-sm text-navy">Active (Visible)</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button className="bg-teal text-white" onClick={handleSave}>Save Product</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StoreOrders() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  
  // Tracking inputs
  const [trackStatus, setTrackStatus] = useState<OrderStatus>('Pending');
  const [courierPartner, setCourierPartner] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await storeService.getOrders();
      // Sort by newest first
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (order: StoreOrder) => {
    setSelectedOrder(order);
    setTrackStatus(order.status);
    setCourierPartner(order.courierPartner || '');
    setCourierPhone(order.courierPhone || '');
    setExpectedDelivery(order.expectedDelivery || '');
    setIsUpdateModalOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    try {
      const updates: Partial<StoreOrder> = {
        status: trackStatus,
        courierPartner,
        courierPhone,
        expectedDelivery
      };
      
      // If status changed, we can also add to tracking updates
      if (trackStatus !== selectedOrder.status) {
        await storeService.updateOrderStatus(selectedOrder.id, trackStatus, `Updated tracking info via Admin panel.`);
      }
      
      await storeService.updateOrder(selectedOrder.id, updates);
      
      toast.success('Order tracking updated successfully');
      setIsUpdateModalOpen(false);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const handleDownloadInvoice = (order: StoreOrder) => {
    try {
      const invoiceData: PDFInvoiceData = {
        type: 'Invoice',
        number: `INV-STR-${order.id.slice(0, 6).toUpperCase()}`,
        date: new Date(order.timestamp).toLocaleDateString(),
        customerName: order.userName,
        customerPhone: order.userPhone,
        customerAddress: order.shippingAddress,
        payMode: order.paymentMethod,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          rate: item.price,
          taxable: item.price * item.quantity,
          amount: item.price * item.quantity
        })),
        summary: {
          taxableAmount: order.subTotal,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          freightCharges: order.deliveryFee,
          discountAmount: 0,
          roundOff: 0
        },
        totalAmount: order.totalAmount,
        bankDetails: 'Atomic Solutions Store',
        terms: 'Thanks for shopping with Atomic Solutions!',
      };
      
      const doc = generateInvoicePDF(invoiceData);
      doc.save(`Invoice_${invoiceData.number}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate invoice');
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-navy">Recent Orders</h3>
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Order ID</th>
              <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Customer</th>
              <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Amount</th>
              <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Payment</th>
              <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
              <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                <td className="p-4 font-bold text-sm text-navy">{order.id.slice(0, 8).toUpperCase()}</td>
                <td className="p-4">
                  <div className="font-bold text-sm text-navy">{order.userName}</div>
                  <div className="text-xs text-gray-500">{order.shippingAddress}</div>
                </td>
                <td className="p-4 font-black text-teal">₹{order.totalAmount}</td>
                <td className="p-4 text-sm font-bold text-gray-600">{order.paymentMethod}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    order.status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                    order.status === 'Delivered' ? 'bg-green-100 text-green-600' :
                    order.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <Button 
                    onClick={() => openUpdateModal(order)}
                    variant="outline"
                    className="text-xs h-8 rounded-lg border-teal text-teal hover:bg-teal hover:text-white flex-1"
                  >
                    Update Order
                  </Button>
                  {order.status === 'Delivered' && (
                    <Button 
                      onClick={() => handleDownloadInvoice(order)}
                      variant="outline"
                      className="text-xs h-8 rounded-lg border-navy text-navy hover:bg-navy hover:text-white"
                      title="Download Invoice"
                    >
                      Invoice
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-bold">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isUpdateModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-navy">Update Order</h2>
                <p className="text-xs text-gray-500 font-medium">Order ID: {selectedOrder.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => setIsUpdateModalOpen(false)}><X size={24} className="text-gray-400" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Order Status</label>
                <select 
                  value={trackStatus} 
                  onChange={(e) => setTrackStatus(e.target.value as OrderStatus)}
                  className="w-full p-3 bg-gray-50 rounded-xl mt-1 outline-none focus:ring-2 ring-teal"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Courier Partner</label>
                <input 
                  type="text" 
                  value={courierPartner} 
                  onChange={(e) => setCourierPartner(e.target.value)}
                  placeholder="e.g. BlueDart, Delhivery"
                  className="w-full p-3 bg-gray-50 rounded-xl mt-1 outline-none focus:ring-2 ring-teal"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Courier Phone / Tracking Link</label>
                <input 
                  type="text" 
                  value={courierPhone} 
                  onChange={(e) => setCourierPhone(e.target.value)}
                  placeholder="Phone No. or Link"
                  className="w-full p-3 bg-gray-50 rounded-xl mt-1 outline-none focus:ring-2 ring-teal"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Expected Delivery</label>
                <input 
                  type="text" 
                  value={expectedDelivery} 
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  placeholder="e.g. 15 Aug 2026, 3-4 Days"
                  className="w-full p-3 bg-gray-50 rounded-xl mt-1 outline-none focus:ring-2 ring-teal"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
              <Button className="bg-teal text-white" onClick={handleUpdateOrder}>Update Tracking Info</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StoreSettingsManager() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [freeThreshold, setFreeThreshold] = useState(0);

  useEffect(() => {
    const fetchS = async () => {
      const s = await storeService.getSettings();
      setSettings(s);
      setDeliveryFee(s.deliveryFee);
      setFreeThreshold(s.freeDeliveryThreshold);
    };
    fetchS();
  }, []);

  const handleSave = async () => {
    try {
      await storeService.updateSettings({
        deliveryFee,
        freeDeliveryThreshold: freeThreshold
      });
      toast.success('Store settings updated');
    } catch (e) {
      toast.error('Failed to update settings');
    }
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="max-w-xl space-y-6 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
      <h3 className="text-xl font-bold text-navy flex items-center gap-2">
        <Settings className="text-teal" /> Store Rules
      </h3>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Standard Delivery Fee (₹)</label>
        <input 
          type="number" 
          value={deliveryFee} 
          onChange={e => setDeliveryFee(Number(e.target.value))} 
          className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-teal font-bold text-navy" 
        />
        <p className="text-xs text-gray-400 mt-2">This flat fee will be applied to the entire cart if the minimum free delivery threshold is not met.</p>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Free Delivery Threshold (₹)</label>
        <input 
          type="number" 
          value={freeThreshold} 
          onChange={e => setFreeThreshold(Number(e.target.value))} 
          className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-teal font-bold text-navy" 
        />
        <p className="text-xs text-gray-400 mt-2">Orders with a subtotal above this amount will get free delivery.</p>
      </div>

      <Button onClick={handleSave} className="w-full bg-navy text-white h-14 rounded-xl font-black uppercase tracking-widest">
        Save Settings
      </Button>
    </div>
  );
}
