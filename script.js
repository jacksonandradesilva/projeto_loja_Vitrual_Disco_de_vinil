const products = [
  { id: 1, title: 'The Dark Side of the Moon', artist: 'Pink Floyd', price: 189.9 },
  { id: 2, title: 'Thriller', artist: 'Michael Jackson', price: 159.9 },
  { id: 3, title: 'Back in Black', artist: 'AC/DC', price: 149.9 },
  { id: 4, title: 'Rumours', artist: 'Fleetwood Mac', price: 139.9 }
];

const cartKey = 'vinyl-store-cart';
const productList = document.getElementById('product-list');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartToggle = document.getElementById('cart-toggle');
const cartPanel = document.getElementById('cart');
const clearCartButton = document.getElementById('clear-cart');

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
}

function renderProducts() {
  productList.innerHTML = products
    .map(
      (product) => `
      <article class="card">
        <h3>${product.title}</h3>
        <p>${product.artist}</p>
        <p><strong>${formatBRL(product.price)}</strong></p>
        <button data-product-id="${product.id}">Adicionar</button>
      </article>
    `
    )
    .join('');
}

function renderCart() {
  const cart = loadCart();

  if (cart.length === 0) {
    cartItems.innerHTML = '<li>Carrinho vazio.</li>';
    cartCount.textContent = '0';
    cartTotal.textContent = `Total: ${formatBRL(0)}`;
    return;
  }

  cartItems.innerHTML = cart
    .map((item) => `<li>${item.title} - ${formatBRL(item.price)}</li>`)
    .join('');

  cartCount.textContent = String(cart.length);
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartTotal.textContent = `Total: ${formatBRL(total)}`;
}

productList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-product-id]');
  if (!button) {
    return;
  }

  const productId = Number(button.dataset.productId);
  const selected = products.find((product) => product.id === productId);

  if (!selected) {
    return;
  }

  const cart = loadCart();
  cart.push(selected);
  saveCart(cart);
  renderCart();
});

cartToggle.addEventListener('click', () => {
  cartPanel.classList.toggle('hidden');
});

clearCartButton.addEventListener('click', () => {
  saveCart([]);
  renderCart();
});

renderProducts();
renderCart();
