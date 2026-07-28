import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { storeService } from '../services/storeService';
import { detectFullLocation } from '../services/locationService';
import { Product, StoreSettings, OrderItem, StoreOrder } from '../types';
import { ShoppingCart, Plus, Minus, X, CheckCircle, Package, ArrowRight, Loader2, MapPin, Truck, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { generateInvoicePDF, PDFInvoiceData } from '../utils/pdfGenerator';

export default function StoreFront() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Orders State
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState<StoreOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Checkout State
  const [isCheckout, setIsCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(profile?.address || '');
  const [addressParts, setAddressParts] = useState({
    houseNo: '',
    street: '',
    landmark: '',
    pincode: '',
    city: ''
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Pay Online'>('Cash on Delivery');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    // If profile address exists but parts don't, try to use it as street
    if (profile?.address && !addressParts.street) {
      setAddressParts(prev => ({ ...prev, street: profile.address as string }));
    }
  }, [profile]);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const location = await detectFullLocation();
      if (location.address) {
        setAddressParts(prev => ({ ...prev, street: location.address || '' }));
        toast.success('Location detected successfully!');
      } else {
        toast.error('Could not auto-detect address. Please enter manually.');
      }
    } catch (e) {
      toast.error('Failed to detect location.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fetchedProducts, fetchedSettings] = await Promise.all([
        storeService.getActiveProducts(),
        storeService.getSettings()
      ]);
      setProducts(fetchedProducts);
      setSettings(fetchedSettings);

      const cats = Array.from(new Set(fetchedProducts.map(p => p.category)));
      setCategories(['All', ...cats]);
    } catch (error) {
      toast.error('Failed to load store data');
    } finally {
      setLoading(false);
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

  useEffect(() => {
    if (isOrdersOpen && user) {
      fetchMyOrders();
    }
  }, [isOrdersOpen, user]);

  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const orders = await storeService.getUserOrders(user!.uid);
      orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setMyOrders(orders);
    } catch (error) {
      toast.error('Failed to load your orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.images?.[0] || ''
      }];
    });
    toast.success('Added to cart');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = settings ? (cartSubtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee) : 0;
  const grandTotal = cartSubtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!user || !profile) {
      toast.error('Please login to place an order');
      return;
    }
    const fullAddress = [
      addressParts.houseNo,
      addressParts.street,
      addressParts.landmark,
      addressParts.city,
      addressParts.pincode ? `PIN: ${addressParts.pincode}` : ''
    ].filter(Boolean).join(', ');

    if (!fullAddress.trim()) {
      toast.error('Please enter a shipping address');
      return;
    }

    const placeFirebaseOrder = async (razorpayPaymentId?: string, razorpayOrderId?: string, razorpaySignature?: string) => {
      try {
        const newOrder: Omit<StoreOrder, 'id'> = {
          userId: user.uid,
          userName: profile.name || user.displayName || 'Customer',
          userPhone: profile.phone || '',
          userEmail: user.email || '',
          shippingAddress: fullAddress,
          items: cart.map(item => ({ ...item, image: item.image || '' })),
          subTotal: cartSubtotal,
          deliveryFee,
          totalAmount: grandTotal,
          paymentMethod,
          status: 'Pending',
          timestamp: new Date().toISOString()
        };

        // Add payment details if online
        if (razorpayPaymentId) {
          (newOrder as any).razorpayPaymentId = razorpayPaymentId;
          (newOrder as any).razorpayOrderId = razorpayOrderId;
          (newOrder as any).razorpaySignature = razorpaySignature;
        }

        await storeService.placeOrder(newOrder);
        setCart([]);
        setOrderPlaced(true);
      } catch (error) {
        console.error('Order placement error:', error);
        toast.error('Failed to place order');
      } finally {
        setIsPlacingOrder(false);
      }
    };

    setIsPlacingOrder(true);

    if (paymentMethod === 'Pay Online') {
      try {
        const res = await fetch('/api/create-razorpay-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: grandTotal,
            receipt: `store_rcpt_${Date.now()}`
          })
        });

        if (!res.ok) throw new Error('Failed to initiate payment');
        const orderData = await res.json();

        const options = {
          key: "rzp_test_SuQMWmPvKU2SJ8", // Hardcoded for frontend initialization (Test key)
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Atomic Solutions",
          description: "Store Purchase",
          image: "https://atomicsolutions.in/logo.png",
          order_id: orderData.id,
          handler: function (response: any) {
            // Payment succeeded
            placeFirebaseOrder(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
          },
          prefill: {
            name: profile.name,
            email: user.email,
            contact: profile.phone || ''
          },
          theme: {
            color: "#0F766E" // teal-700
          },
          modal: {
            ondismiss: function () {
              setIsPlacingOrder(false);
              toast.error("Payment cancelled");
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          toast.error(response.error.description || "Payment failed");
          setIsPlacingOrder(false);
        });
        rzp.open();

      } catch (error) {
        console.error("Payment error", error);
        toast.error("Could not start payment gateway");
        setIsPlacingOrder(false);
      }
    } else {
      // Cash on delivery
      await placeFirebaseOrder();
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Store Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-navy uppercase tracking-tighter flex items-center gap-3">
              <Package size={36} className="text-teal" />
              Atomic Store
            </h1>
            <p className="text-gray-500 font-medium mt-2">Professional equipment and materials</p>
          </div>
          
          <div className="flex items-center gap-3">
            {user && (
              <button 
                onClick={() => setIsOrdersOpen(true)}
                className="relative p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-teal transition-colors flex items-center gap-2"
              >
                <Package className="text-navy" size={20} />
                <span className="text-xs font-bold text-navy hidden sm:inline">My Orders</span>
              </button>
            )}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-teal transition-colors"
            >
              <ShoppingCart className="text-navy" size={24} />
              {cartItemCount > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
                  {cartItemCount}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto gap-3 pb-4 mb-6 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-navy text-white shadow-md' 
                  : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={product.id} 
              className="bg-white rounded-[2rem] border border-gray-100 p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden relative">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package size={48} />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-navy">
                  {product.category}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <h3 className="font-bold text-navy line-clamp-2 leading-tight mb-2">{product.name}</h3>
                
                <div className="mt-auto pt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-lg font-black text-navy">₹{product.price}</div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-xs text-gray-400 line-through">₹{product.originalPrice}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => addToCart(product)}
                      variant="outline"
                      className="flex-1 h-10 rounded-xl border-teal text-teal hover:bg-teal/5 font-bold text-xs uppercase tracking-widest px-2"
                    >
                      <ShoppingCart size={14} className="mr-1" /> Cart
                    </Button>
                    <Button 
                      onClick={() => {
                        addToCart(product);
                        setIsCartOpen(true);
                      }}
                      className="flex-1 h-10 rounded-xl bg-teal text-white hover:bg-teal/90 font-bold text-xs uppercase tracking-widest shadow-md shadow-teal/20 px-2"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-400">No products found</h3>
            </div>
          )}
        </div>
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-[10000] transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white z-[10001] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Cart Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-2xl font-black text-navy uppercase tracking-tighter flex items-center gap-3">
                <ShoppingCart className="text-teal" />
                Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                <X size={24} />
              </button>
            </div>

            {orderPlaced ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={48} />
                </div>
                <h3 className="text-2xl font-black text-navy mb-2 uppercase tracking-tight">Order Placed!</h3>
                <p className="text-gray-500 mb-8">Your order has been successfully placed. We will contact you shortly.</p>
                <Button 
                  onClick={() => {
                    setIsCartOpen(false);
                    setOrderPlaced(false);
                    setIsCheckout(false);
                  }}
                  className="w-full bg-navy text-white h-14 rounded-2xl font-black uppercase tracking-widest"
                >
                  Continue Shopping
                </Button>
              </div>
            ) : isCheckout ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Shipping Address</label>
                    <button 
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="text-[9px] font-black text-blue-600 uppercase tracking-tighter hover:text-navy transition-colors flex items-center gap-1"
                    >
                      {isDetectingLocation ? <Loader2 size={10} className="animate-spin" /> : <MapPin size={10} />} Auto-detect Location
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text"
                        placeholder="House / Flat No."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                        value={addressParts.houseNo}
                        onChange={(e) => setAddressParts({...addressParts, houseNo: e.target.value})}
                      />
                      <input 
                        type="text"
                        placeholder="Landmark"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                        value={addressParts.landmark}
                        onChange={(e) => setAddressParts({...addressParts, landmark: e.target.value})}
                      />
                    </div>
                    
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all h-20 resize-none"
                      placeholder="Street, Locality, Area..."
                      value={addressParts.street}
                      onChange={(e) => setAddressParts({...addressParts, street: e.target.value})}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text"
                        placeholder="City"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                        value={addressParts.city}
                        onChange={(e) => setAddressParts({...addressParts, city: e.target.value})}
                      />
                      <input 
                        type="text"
                        placeholder="Pincode"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm text-navy outline-none focus:bg-white focus:border-teal transition-all"
                        value={addressParts.pincode}
                        onChange={(e) => setAddressParts({...addressParts, pincode: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Payment Method</label>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'Cash on Delivery' ? 'bg-teal/5 border-teal' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="payment" checked={paymentMethod === 'Cash on Delivery'} onChange={() => setPaymentMethod('Cash on Delivery')} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'Cash on Delivery' ? 'border-teal' : 'border-gray-300'}`}>
                        {paymentMethod === 'Cash on Delivery' && <div className="w-2.5 h-2.5 bg-teal rounded-full" />}
                      </div>
                      <span className="font-bold text-navy">Cash on Delivery</span>
                    </label>
                    <label className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'Pay Online' ? 'bg-teal/5 border-teal' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="payment" checked={paymentMethod === 'Pay Online'} onChange={() => setPaymentMethod('Pay Online')} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'Pay Online' ? 'border-teal' : 'border-gray-300'}`}>
                        {paymentMethod === 'Pay Online' && <div className="w-2.5 h-2.5 bg-teal rounded-full" />}
                      </div>
                      <span className="font-bold text-navy">Pay Online</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.productId} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-navy truncate">{item.name}</h4>
                        <div className="text-teal font-black text-sm mt-1">₹{item.price}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-600">
                            <Minus size={14} />
                          </button>
                          <span className="font-bold text-sm text-navy w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-600">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="font-black text-navy flex-shrink-0">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Cart Footer */}
            {!orderPlaced && cart.length > 0 && (
              <div className="p-6 bg-white border-t border-gray-100">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm font-medium text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1"><Truck size={16}/> Delivery Fee</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-green-500 font-bold">FREE</span>
                      ) : (
                        `₹${deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {deliveryFee > 0 && settings && (
                    <div className="text-[10px] text-teal font-bold bg-teal/5 p-2 rounded-lg text-center">
                      Add ₹{(settings.freeDeliveryThreshold - cartSubtotal).toFixed(2)} more for FREE delivery!
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-navy">Total</span>
                    <span className="text-2xl font-black text-navy">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {!isCheckout ? (
                  <Button 
                    onClick={() => setIsCheckout(true)}
                    className="w-full h-14 bg-navy text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-navy/20"
                  >
                    Proceed to Checkout <ArrowRight className="ml-2" size={18} />
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => setIsCheckout(false)}
                      className="h-14 rounded-2xl font-bold px-6"
                      disabled={isPlacingOrder}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder}
                      className="flex-1 h-14 bg-teal text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-teal/20"
                    >
                      {isPlacingOrder ? <Loader2 className="animate-spin" size={20} /> : 'Place Order'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* My Orders Drawer */}
      {isOrdersOpen && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-50 flex justify-end">
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-black text-navy uppercase tracking-tighter flex items-center gap-2">
                <Package className="text-teal" size={24} /> My Orders
              </h2>
              <button onClick={() => setIsOrdersOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {loadingOrders ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-teal" />
                </div>
              ) : myOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">You haven't placed any orders yet.</p>
                </div>
              ) : (
                myOrders.map(order => (
                  <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                        <p className="text-sm font-bold text-navy">{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        order.status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                        order.status === 'Delivered' ? 'bg-green-100 text-green-600' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">{item.quantity}x {item.name}</span>
                          <span className="font-bold text-navy">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Amount</span>
                      <span className="font-black text-teal">₹{order.totalAmount}</span>
                    </div>

                    {/* Tracking Info Section */}
                    {(order.courierPartner || order.expectedDelivery) && (
                      <div className="mt-4 p-4 bg-teal/5 rounded-xl border border-teal/10 space-y-2">
                        <h4 className="text-[10px] font-black text-teal uppercase tracking-widest flex items-center gap-1 mb-2">
                          <Truck size={12} /> Delivery Info
                        </h4>
                        {order.courierPartner && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-medium">Courier:</span>
                            <span className="font-bold text-navy">{order.courierPartner}</span>
                          </div>
                        )}
                        {order.courierPhone && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-medium">Tracking/Phone:</span>
                            <span className="font-bold text-navy">{order.courierPhone}</span>
                          </div>
                        )}
                        {order.expectedDelivery && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-medium">Expected By:</span>
                            <span className="font-bold text-teal">{order.expectedDelivery}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Invoice Download Button for Delivered Orders */}
                    {order.status === 'Delivered' && (
                      <div className="pt-2">
                        <Button 
                          onClick={() => handleDownloadInvoice(order)}
                          variant="outline"
                          className="w-full text-xs font-bold border-navy text-navy hover:bg-navy hover:text-white h-10 flex items-center justify-center gap-2"
                        >
                          <FileText size={14} /> Download Invoice
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
