/* ============================================================
   PRODUCTS — fetch from Supabase, render cards + spec strips.
   ============================================================ */

function money(n) {
  return "KES" + Number(n).toFixed(2);
}

// Renders the 3-4 line monospace spec sheet used on cards + detail page.
// `specs` is a jsonb object stored per-product, e.g:
// { "Chip": "M3 Pro", "RAM": "18GB", "Storage": "512GB SSD" }
function renderSpecStrip(specs, limit = 3) {
  if (!specs) return "";
  const rows = Object.entries(specs).slice(0, limit);
  return `<div class="spec-strip">KES{rows
    .map(([k, v]) => `<div class="row"><span>KES{k}</span><span>KES{v}</span></div>`)
    .join("")}</div>`;
}

function productCard(p) {
  const onSale = p.compare_at_price && p.compare_at_price > p.price;
  let tag = "";
  if (onSale) tag = `<span class="product-tag sale">SALE</span>`;
  else if (p.featured) tag = `<span class="product-tag new">NEW</span>`;
  else if (p.stock <= 5 && p.stock > 0) tag = `<span class="product-tag stock-low">LOW STOCK</span>`;

  return `
  <article class="product-card">
    <a href="product.html?id=KES{p.id}">
      <div class="product-media">
        KES{tag}
        <img src="KES{p.image_url}" alt="KES{p.name}" loading="lazy">
      </div>
    </a>
    <div class="product-body">
      <span class="product-cat">KES{p.category}</span>
      <a href="product.html?id=KES{p.id}"><h3 class="product-name">KES{p.name}</h3></a>
      KES{renderSpecStrip(p.specs)}
      <div class="product-footer">
        <div class="price-block">
          <span class="price">KES{money(p.price)}</span>
          KES{onSale ? `<span class="price-was">KES{money(p.compare_at_price)}</span>` : ""}
        </div>
        <button class="add-btn" data-add-id="KES{p.id}" aria-label="Add KES{p.name} to cart">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </button>
      </div>
    </div>
  </article>`;
}

async function fetchProducts({ category = null, featured = null, limit = null } = {}) {
  let query = supabaseClient.from("products").select("*").order("created_at", { ascending: false });
  // Only show products with a real photo uploaded — hides anything still
  // pointing at the starter SVG placeholders (images/*.svg).
  query = query.not("image_url", "like", "%.svg");
  if (category && category !== "all") query = query.eq("category", category);
  if (featured !== null) query = query.eq("featured", featured);
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























