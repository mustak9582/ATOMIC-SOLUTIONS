import{c as a,d as e}from"./index-BJXS3laz.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],u=a("circle-check-big",n);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]],p=a("shopping-cart",d),l={getProducts:async()=>await e.getCollection("store_products"),getActiveProducts:async()=>(await e.getCollection("store_products")).filter(r=>r.isActive&&r.inStock),getProduct:async t=>await e.getDoc("store_products",t),addProduct:async t=>await e.addDoc("store_products",t),updateProduct:async(t,r)=>await e.updateDoc("store_products",t,r),deleteProduct:async t=>await e.deleteDoc("store_products",t),getOrders:async()=>await e.getCollection("store_orders"),getUserOrders:async t=>(await e.getCollection("store_orders")).filter(o=>o.userId===t),placeOrder:async t=>await e.addDoc("store_orders",t),updateOrderStatus:async(t,r,o)=>{const s=await e.getDoc("store_orders",t);if(!s)throw new Error("Order not found");const c=s.trackingUpdates||[];return c.push({status:r,timestamp:new Date().toISOString(),note:o}),await e.updateDoc("store_orders",t,{status:r,trackingUpdates:c})},updateOrder:async(t,r)=>await e.updateDoc("store_orders",t,r),getSettings:async()=>{const t=await e.getDoc("store_settings","main");return t||{deliveryFee:50,freeDeliveryThreshold:500,isActive:!0}},updateSettings:async t=>await e.setDoc("store_settings","main",t)};export{u as C,p as S,l as s};
