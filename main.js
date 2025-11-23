document.addEventListener("DOMContentLoaded", () => {
  // ===========================
  // SELETORES DE ELEMENTOS DOM
  // ===========================
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const navLinks =
    document.getElementById("mobile-menu") ||
    document.getElementById("nav-links");
  const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
  const cartIcon = document.getElementById("cart-icon");
  const cartModalOverlay = document.getElementById("cart-modal-overlay");
  const cartModal = document.getElementById("cart-modal");
  const cartCloseBtn = document.getElementById("cart-close-btn");
  const cartBody = document.getElementById("cart-body");
  const cartItemCount = document.getElementById("cart-item-count");
  const cartTotal = document.getElementById("cart-total");
  const productGrid = document.querySelector(".product-grid"); // Para favoritos
  const checkoutBtn = document.querySelector(".checkout-btn");
  const productDetails = document.querySelector(".product-details"); // Para página de produto

  // =======================
  // ESTADO DA APLICAÇÃO
  // =======================
  let cart = JSON.parse(localStorage.getItem("shoppingCart")) || [];

  // =======================
  // EVENT LISTENERS
  // =======================

  // --- Menu Hambúrguer ---
  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener("click", () =>
      navLinks.classList.toggle("active")
    );
  }

  // --- Carrinho ---
  if (cartIcon) {
    cartIcon.addEventListener("click", (e) => {
      e.preventDefault();
      toggleCartModal();
    });
  }
  if (cartCloseBtn) cartCloseBtn.addEventListener("click", toggleCartModal);
  if (cartModalOverlay)
    cartModalOverlay.addEventListener("click", (e) => {
      if (e.target === cartModalOverlay) {
        toggleCartModal();
      }
    });

  // --- Adicionar ao Carrinho ---
  addToCartButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const productElement = e.target.closest(
        ".product-card[data-id], .product-details[data-id]"
      );
      if (!productElement) return;

      const id = productElement.dataset.id;
      const name = productElement.dataset.name;
      const price = parseFloat(productElement.dataset.price);
      const image =
        productElement.dataset.image ||
        productElement.querySelector("img")?.src;

      // Lógica para produtos com variantes (tamanho/cor)
      const sizeOptionsContainer = document.getElementById("size-options");
      let size = null;
      let variantId = id;

      if (sizeOptionsContainer) {
        const selectedSizeEl = sizeOptionsContainer.querySelector(
          ".size-option.selected"
        );
        if (!selectedSizeEl) {
          alert(
            "Por favor, selecione um tamanho antes de adicionar ao carrinho."
          );
          return;
        }
        size = selectedSizeEl.dataset.size;
        variantId = `${id}-${size}`; // Cria um ID único para a variante
      }

      addItemToCart(variantId, name, price, image, size);
    });
  });

  // --- Ações no Carrinho (Aumentar/Diminuir quantidade) ---
  if (cartBody) {
    cartBody.addEventListener("click", (e) => {
      const target = e.target;
      const id = target.closest(".cart-item")?.dataset.id;
      if (!id) return;

      if (target.classList.contains("quantity-increase")) {
        updateItemQuantity(id, 1);
      } else if (target.classList.contains("quantity-decrease")) {
        updateItemQuantity(id, -1);
      }
    });
  }

  // --- Seleção de Tamanho na Página de Produto ---
  const sizeOptionsContainer = document.getElementById("size-options");
  if (sizeOptionsContainer) {
    sizeOptionsContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("size-option")) {
        sizeOptionsContainer
          .querySelectorAll(".size-option")
          .forEach((opt) => opt.classList.remove("selected"));
        e.target.classList.add("selected");
      }
    });
  }

  // =======================
  // FUNÇÕES DO CARRINHO
  // =======================

  function toggleCartModal() {
    if (cartModalOverlay && cartModal) {
      cartModalOverlay.classList.toggle("active");
      cartModal.classList.toggle("active");
    }
  }

  function addItemToCart(id, name, price, image, size = null) {
    const existingItem = cart.find((item) => item.id === id);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      const newItem = { id, name, price, image, quantity: 1 };
      if (size) {
        newItem.size = size;
      }
      cart.push(newItem);
    }
    updateCart();
    toggleCartModal(); // Abre o carrinho ao adicionar um item
  }

  function updateItemQuantity(id, change) {
    const itemIndex = cart.findIndex((item) => item.id === id);
    if (itemIndex === -1) return;

    cart[itemIndex].quantity += change;

    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
    updateCart();
  }

  function updateCart() {
    renderCartItems();
    renderSubtotal();
    updateCartIconCount();
    localStorage.setItem("shoppingCart", JSON.stringify(cart));
  }

  function renderCartItems() {
    if (!cartBody) return;
    if (cart.length === 0) {
      cartBody.innerHTML =
        '<p class="text-center p-4">Seu carrinho está vazio.</p>';
      return;
    }
    cartBody.innerHTML = cart
      .map(
        (item) => `
              <div class="cart-item" data-id="${item.id}">
                  <img src="${item.image}" alt="${
          item.name
        }" onerror="this.onerror=null;this.src='https://placehold.co/80x80/f4f4f4/ccc?text=Img';">
                  <div class="cart-item-info">
                      <h4>${item.name}</h4>
                      ${
                        item.size
                          ? `<p class="text-muted">Tamanho: ${item.size}</p>`
                          : ""
                      }
                      <p>R$ ${item.price.toFixed(2).replace(".", ",")}</p>
                      <div class="cart-item-actions">
                          <button class="quantity-decrease">-</button>
                          <span>${item.quantity}</span>
                          <button class="quantity-increase">+</button>
                      </div>
                  </div>
              </div>`
      )
      .join("");
  }

  function renderSubtotal() {
    if (!cartTotal) return;
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cartTotal.textContent = `R$ ${total.toFixed(2).replace(".", ",")}`;
  }

  function updateCartIconCount() {
    if (!cartItemCount) return;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartItemCount.textContent = totalItems;
    cartItemCount.style.display = totalItems > 0 ? "block" : "none";
  }

  // =======================
  // FUNÇÕES DE FAVORITOS
  // =======================

  function toggleFavorite(product) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const existingIndex = favorites.findIndex((item) => item.id === product.id);

    if (existingIndex > -1) {
      favorites.splice(existingIndex, 1);
      updateFavoriteIcon(product.id, false);
    } else {
      favorites.push(product);
      updateFavoriteIcon(product.id, true);
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  function updateFavoriteIcon(productId, isFavorited) {
    const cardOnPage = document.querySelector(
      `.product-card[data-id="${productId}"]`
    );
    if (!cardOnPage) return;

    const iconElement = cardOnPage.querySelector(".favorite-icon");
    if (!iconElement) return;

    const icon = iconElement.querySelector("i");
    if (isFavorited) {
      iconElement.classList.add("favorited");
      icon.classList.remove("far");
      icon.classList.add("fas");
    } else {
      iconElement.classList.remove("favorited");
      icon.classList.remove("fas");
      icon.classList.add("far");
    }
  }

  function initializeFavoriteIcons() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const products = document.querySelectorAll(".product-card");
    products.forEach((card) => {
      const isFavorited = favorites.some((fav) => fav.id === card.dataset.id);
      updateFavoriteIcon(card.dataset.id, isFavorited);
    });
  }

  if (productGrid) {
    productGrid.addEventListener("click", (e) => {
      const favoriteIcon = e.target.closest(".favorite-icon");
      if (favoriteIcon) {
        e.preventDefault();
        const card = favoriteIcon.closest(".product-card");
        const product = {
          id: card.dataset.id,
          name: card.dataset.name,
          price: parseFloat(card.dataset.price),
          image: card.querySelector("img").src,
        };
        toggleFavorite(product);
      }
    });
  }

  // =======================
  // INICIALIZAÇÃO
  // =======================
  updateCart();
  if (productGrid) {
    initializeFavoriteIcons();
  }
});
