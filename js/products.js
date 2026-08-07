/* ============================================================
   PRODUCTS - fetch from Supabase, render cards + spec strips.
   money() and KES_RATE come from js/cart.js (loaded before this
   file on every page) so currency formatting stays consistent
   site-wide - this file no longer defines its own copy.
   ============================================================ */

// Renders the 3-4 line monospace spec sheet used on cards + detail page.
// `specs` is a jsonb object stored per-product, e.g:
// { "Chip": "M3 Pro", "RAM": "18GB", "Storage": "512GB SSD" }
function renderSpecStrip(specs, limit = 3) {
  if (!specs) return "";
  const rows = Object.entries(specs).slice(0, limit);
  return `<div class="spec-strip">${rows
    .map(([k, v]) => `<div class="row"><span>${k}</span><span>${v}</span></div>`)
    .join("")}</div>`;
}

function productCard(p) {
  const onSale = p.compare_at_price && p.compare_at_price > p.price;
  let tag = "";
  if (onSale) tag = `<span class="product-tag sale">SALE</span>`;
  else if (p.featured) tag = `<span class="product-tag new">NEW</span>`;
  else if (p.stock <= 5 && p.stock > 0) tag = `<span class="product-tag stock-low">ONLY ${p.stock} LEFT</span>`;

  return `
  <article class="product-card">
    <a href="product.html?id=${p.id}">
      <div class="product-media">
        ${tag}
        <img src="${p.image_url}" alt="${p.name}" loading="lazy">
      </div>
    </a>
    <div class="product-body">
      <span class="product-cat">${p.category}</span>
      <a href="product.html?id=${p.id}"><h3 class="product-name">${p.name}</h3></a>
      ${renderSpecStrip(p.specs)}
      <div class="product-footer">
        <div class="price-block">
          <span class="price">${money(p.price)}</span>
          ${onSale ? `<span class="price-was">${money(p.compare_at_price)}</span>` : ""}
        </div>
        <button class="add-btn" data-add-id="${p.id}" aria-label="Add ${p.name} to cart">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </button>
      </div>
    </div>
  </article>`;
}

async function fetchProducts({ category = null, categories = null, featured = null, limit = null, onSaleOnly = false } = {}) {
  let query = supabaseClient.from("products").select("*").order("created_at", { ascending: false });
  // Only show products with a real photo uploaded - hides anything still
  // pointing at the starter SVG placeholders (images/*.svg). Applies to
  // every category, laptops included.
  query = query.not("image_url", "like", "%.svg");
  if (category && category !== "all") query = query.eq("category", category);
  // categories: pass an array to fetch multiple, e.g. ["iphones","samsung"]
  if (categories && categories.length) query = query.in("category", categories);
  if (featured !== null) query = query.eq("featured", featured);
  if (onSaleOnly) query = query.not("compare_at_price", "is", null);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return data;
}

async function fetchProductById(id) {
  const { data, error } = await supabaseClient.from("products").select("*").eq("id", id).single();
  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }
  return data;
}

function bindAddToCartButtons(container, products) {
  container.querySelectorAll("[data-add-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const product = products.find((p) => p.id === btn.dataset.addId);
      if (product) {
        addToCart(product, 1);
        btn.textContent = "";
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>`;
        setTimeout(() => {
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
        }, 1200);
      }
    });
  });
}