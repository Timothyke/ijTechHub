/* ============================================================
   CART — persisted in localStorage, no backend needed.
   Shape: [{ id, name, price, image_url, category, qty }]
   `price` is always stored/summed in USD (the real, underlying
   value) — KES is a DISPLAY conversion only, applied by money()
   below. This keeps totals accurate regardless of which currency
   is shown on screen.
   ============================================================ */

const CART_KEY = "nexus_cart";

// Approximate KES → USD rate, used ONLY to convert the real KES total
// into a USD amount at the moment PayPal is charged (PayPal doesn't
// support settling in KES). `price` on every product/cart item is
// stored directly in KES — this constant is never applied to display,
// only at the actual checkout charge. Update periodically.
const KES_RATE = 129;

// `price` is the real KES value — this just formats it, no conversion.
function money(kesAmount) {
  return "KES " + Number(kesAmount).toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      qty,
    });
  }
  saveCart(cart);
}

function removeFromCart(id) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
}

function updateQty(id, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, qty);
  saveCart(cart);
}

// Returns the cart subtotal in KES — the real, stored value.
// Divide by KES_RATE (or use checkout.js's usd conversion) only
// at the moment of the actual PayPal charge.
function cartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

function updateCartCount() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = cartCount();
  });
}

document.addEventListener("DOMContentLoaded", updateCartCount);
