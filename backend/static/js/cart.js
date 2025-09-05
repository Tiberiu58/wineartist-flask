
const CART_KEY = "wineartist_cart";
const $cartCount = () => document.getElementById("cartCount");
const $cartDrawer = () => document.getElementById("cartDrawer");
const $overlay = () => document.getElementById("overlay");
const $cartItems = () => document.getElementById("cartItems");
const $cartSubtotal = () => document.getElementById("cartSubtotal");

function loadCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
}
function saveCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); }
function cartCount(items){ return items.reduce((s, it)=>s + it.qty, 0); }
function cartTotal(items){ return items.reduce((s, it)=>s + it.price * it.qty, 0); }
function formatEUR(cents){ return "€" + (cents/100).toFixed(2); }

function renderCart(){
  const items = loadCart();
  $cartItems().innerHTML = "";
  if(items.length === 0){
    $cartItems().innerHTML = '<p style="opacity:.75">Your cart is empty.</p>';
  } else {
    items.forEach(it => {
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <div>
          <div class="name">${it.name}</div>
          <div class="meta">${it.qty} × ${formatEUR(it.price)}</div>
        </div>
        <button class="remove" data-id="${it.id}">Remove</button>
      `;
      $cartItems().appendChild(div);
    });
  }
  $cartSubtotal().textContent = formatEUR(cartTotal(items));
  $cartCount().textContent = String(cartCount(items));
}

function openCart(){
  document.body.classList.add("show");
  renderCart();
}
function closeCart(){
  document.body.classList.remove("show");
}

document.addEventListener("click", (e)=>{
  const t = e.target;
  if(t.matches(".add-to-cart")){
    const id = t.dataset.id, name = t.dataset.name, price = parseInt(t.dataset.price,10);
    const items = loadCart();
    const idx = items.findIndex(x=>x.id===id);
    if(idx>-1) items[idx].qty += 1;
    else items.push({id, name, price, qty:1});
    saveCart(items);
    renderCart();
  }
  if(t.id==="cartButton"){ openCart(); }
  if(t.id==="cartClose" || t.id==="overlay"){ closeCart(); }
  if(t.classList.contains("remove")){
    const id = t.dataset.id;
    const items = loadCart().filter(x=>x.id!==id);
    saveCart(items);
    renderCart();
  }
});

window.addEventListener("DOMContentLoaded", ()=>{
  renderCart();
  const checkout = document.getElementById("checkoutBtn");
  checkout?.addEventListener("click", async ()=>{
    const items = loadCart();
    if(items.length===0) return alert("Your cart is empty.");
    try {
      const res = await fetch("/create-checkout-session", {
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ items: items.map(({id, qty})=>({id, qty})) })
      });
      const data = await res.json();
      if(data.url){ window.location.href = data.url; }
      else if(data.ok){ alert(data.message || "Checkout stubbed. Add STRIPE_SECRET_KEY to enable Stripe."); }
      else if(data.error){ alert("Error: " + data.error); }
    } catch(err){
      alert("Network error: " + err);
    }
  });
});
