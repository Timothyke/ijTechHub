/* ============================================================
   CART — persisted in localStorage, no backend needed.
   Shape: [{ id, name, price, image_url, category, qty }]
   `price` is always stored/summed in USD (the real, underlying
   value) — KES is a DISPLAY conversion only, applied by money()
   below. This keeps totals accurate regardless of which currency
   is shown on screen.
   ============================================================ */

const CART_KEY = "nexus_cart";

// Approximate USD → KES rate. PayPal does not support charging in
// KES directly, so the real transaction always happens in USD —
// this constant is only used to SHOW a KES-equivalent price to
// shoppers. Update this periodically to stay close to the real
// exchange rate (check e.g. xe.com/currencyconverter).
const KES_RATE = 129;

// Every page includes this file, so this is the one place that
// defines how a price is displayed. Pass it a USD amount (the
// value actually stored on products/cart items) and it returns a
// formatted KES string.
function money(usdAmount) {
  const kes = Number(usdAmount) * KES_RATE;
  return "KES " + kes.toLocaleString("en-KE", { maximumFractionDigits: 0 });
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

// Returns the raw USD subtotal — the real value, not the display
// currency. Multiply by KES_RATE (or call money()) when showing
// it to the user.
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
