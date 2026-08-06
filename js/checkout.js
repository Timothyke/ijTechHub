/* ============================================================
   CHECKOUT — renders order summary in KES for the shopper, but
   creates the actual PayPal order in USD, since PayPal does not
   support KES as a transaction currency. money() and KES_RATE
   come from js/cart.js.
   ============================================================ */

function usdMoney(n) {
  return "$" + Number(n).toFixed(2);
}

function renderSummary() {
  const cart = getCart();
  const linesEl = document.getElementById("order-lines");

  if (cart.length === 0) {
    linesEl.innerHTML = `<p style="font-family:var(--font-mono); font-size:.8rem; color:var(--text-faint);">Your cart is empty. <a href="products.html" style="color:var(--accent);">Go shopping &rarr;</a></p>`;
    document.getElementById("paypal-button-container").style.display = "none";
    document.getElementById("paypal-hint").style.display = "none";
  }

  linesEl.innerHTML = cart
    .map((item) => `<div class="order-line"><span>${item.name} \u00d7 ${item.qty}</span><span>${money(item.price * item.qty)}</span></div>`)
    .join("");

  const subtotal = cartTotal(); // USD, the real value
  const shipping = subtotal === 0 ? 0 : subtotal >= 500 ? 0 : 15; // USD threshold
  const totalUsd = subtotal + shipping;

  document.getElementById("sum-subtotal").textContent = money(subtotal);
  document.getElementById("sum-shipping").textContent = shipping === 0 ? "Free" : money(shipping);
  document.getElementById("sum-total").textContent = money(totalUsd);

  const usdNote = document.getElementById("usd-charge-note");
  if (usdNote) {
    usdNote.textContent = `You'll be charged the USD equivalent via PayPal: ${usdMoney(totalUsd)}`;
  }

  return totalUsd;
}

function showStatus(message, type) {
  const el = document.getElementById("status-msg");
  el.textContent = message;
  el.className = "status-msg show " + type;
}

function getShippingDetails() {
  return {
    name: document.getElementById("full-name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim(),
    city: document.getElementById("city").value.trim(),
    country: document.getElementById("country").value.trim(),
  };
}

function formIsValid() {
  const form = document.getElementById("checkout-form");
  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }
  return true;
}

let orderTotalUsd = renderSummary();

if (window.paypal && getCart().length > 0) {
  paypal
    .Buttons({
      style: { layout: "vertical", color: "black", shape: "rect", label: "paypal" },

      // Block payment until the shipping form is filled in.
      onClick: (data, actions) => {
        if (!formIsValid()) return actions.reject();
        return actions.resolve();
      },

      createOrder: (data, actions) => {
        orderTotalUsd = renderSummary();
        return actions.order.create({
          purchase_units: [
            {
              // PayPal charges in USD — the real transaction currency.
              // KES on screen is a display conversion only.
              amount: { value: orderTotalUsd.toFixed(2), currency_code: "USD" },
              description: "Tech Hub order \u2014 " + getCart().length + " item(s)",
            },
          ],
        });
      },

      onApprove: async (data, actions) => {
        const captureResult = await actions.order.capture();
        const shipping = getShippingDetails();
        const cart = getCart();

        const { error } = await supabaseClient.from("orders").insert({
          paypal_order_id: captureResult.id,
          customer_name: shipping.name,
          customer_email: shipping.email,
          customer_phone: shipping.phone,
          shipping_address: `${shipping.address}, ${shipping.city}, ${shipping.country}`,
          items: cart,
          total: orderTotalUsd,
          status: "paid",
        });

        if (error) {
          console.error("Order save failed:", error);
          showStatus("Payment succeeded, but we couldn't save your order automatically. Please contact support with reference " + captureResult.id, "error");
          return;
        }

        clearCart();
        showStatus("Payment successful \u2014 thank you! A confirmation has been sent to " + shipping.email + ". Reference: " + captureResult.id, "success");
        document.getElementById("checkout-form").querySelectorAll("input, textarea").forEach((f) => (f.disabled = true));
        document.getElementById("paypal-button-container").style.display = "none";
      },

      onError: (err) => {
        console.error("PayPal error:", err);
        showStatus("Something went wrong with PayPal. Please try again or use a different payment method.", "error");
      },
    })
    .render("#paypal-button-container");
}
