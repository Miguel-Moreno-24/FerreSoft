const textosCarrito = {
  es: {
    title: 'FerreSoft - Carrito de Compras',
    heading: 'FerreSoft - Carrito de Compras',
    back: 'Volver a la Tienda',
    cart: 'Tu Carrito',
    emptyTitle: 'Tu carrito está vacío',
    emptyDescription: 'Agrega algunos productos para comenzar tu compra.',
    buy: 'Ir a Comprar',
    total: 'Total',
    clear: 'Vaciar Carrito',
    continue: 'Continuar con el Pago',
    remove: 'Eliminar',
  },
  en: {
    title: 'FerreSoft - Shopping Cart',
    heading: 'FerreSoft - Shopping Cart',
    back: 'Back to Store',
    cart: 'Your Cart',
    emptyTitle: 'Your cart is empty',
    emptyDescription: 'Add some products to start your purchase.',
    buy: 'Start Shopping',
    total: 'Total',
    clear: 'Empty Cart',
    continue: 'Continue to Payment',
    remove: 'Remove',
  },
}

function textoCarrito(key) {
  const language = getCurrentLanguage()
  return textosCarrito[language]?.[key] || textosCarrito.es[key]
}

function applyCartTexts() {
  document.title = textoCarrito('title')
  document.querySelector('header h1').textContent = textoCarrito('heading')
  document.querySelector('.nav-link-light').textContent = textoCarrito('back')
  document.querySelector('.cart-container h2').textContent = textoCarrito('cart')
  const clearBtn = document.querySelector('.cart-actions .btn-danger')
  const continueBtn = document.querySelector('.cart-actions .btn-success')
  if (clearBtn) clearBtn.textContent = textoCarrito('clear')
  if (continueBtn) continueBtn.textContent = textoCarrito('continue')
}

async function checkUserAuth() {
  try {
    const response = await fetch('../controllers/auth.php?action=check')
    const data = await response.json()

    if (!data.logged_in) {
      showConfirm('Debes iniciar sesión para ver el carrito. ¿Ir al inicio de sesión?', () => {
        window.location.href = 'login.html'
      }, () => {
        showToast('Continúa navegando por la tienda', 'info')
      })
    }
  } catch (error) {
    console.log('Error comprobando la autenticación:', error)
    showConfirm('No pudimos comprobar tu sesión. ¿Ir al inicio de sesión?', () => {
      window.location.href = 'login.html'
    }, () => {
      showToast('Continúa navegando por la tienda', 'info')
    })
  }
}

async function loadCart() {
  try {
    const response = await fetch('../controllers/carrito.php?action=list')
    const data = await response.json()

    const container = document.getElementById('cart-items')
    const summary = document.getElementById('cart-summary')
    if (!container || !summary) return

    if (!data.success || data.items.length === 0) {
      container.innerHTML = `
        <div class="empty-cart">
          <h3>${textoCarrito('emptyTitle')}</h3>
          <p>${textoCarrito('emptyDescription')}</p>
          <a href="index.html" class="btn">${textoCarrito('buy')}</a>
        </div>
      `
      summary.style.display = 'none'
      return
    }

    container.innerHTML = ''

    data.items.forEach((item) => {
      const div = document.createElement('div')
      div.className = 'cart-item'
      div.innerHTML = `
        <img src="${resolveImagePath(item.imagen)}" alt="${item.nombre}" style="cursor: pointer;" onclick="openProductModal(${item.producto_id}, true)">
        <div class="cart-item-info">
          <h4><a href="#" onclick="event.preventDefault(); openProductModal(${item.producto_id}, true)">${item.nombre}</a></h4>
          <p class="precio">$${Number.parseFloat(item.precio).toFixed(2)}</p>
        </div>
        <div class="cart-item-actions">
          <div class="cart-quantity-control">
            <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.cantidad - 1})">−</button>
            <input type="number" id="qty-${item.id}" class="qty-input-cart" value="${item.cantidad}" min="1" onchange="handleQuantityChange(${item.id}, this.value)">
            <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.cantidad + 1})">+</button>
          </div>
          <p class="precio">$${Number.parseFloat(item.subtotal).toFixed(2)}</p>
          <button class="btn btn-danger" onclick="removeFromCart(${item.id})">${textoCarrito('remove')}</button>
        </div>
      `
      container.appendChild(div)
    })

    document.getElementById('cart-total').textContent = Number.parseFloat(data.total).toFixed(2)
    summary.style.display = 'block'
  } catch (error) {
    console.log('Error cargando el carrito:', error)
  }
}

async function updateCartQuantity(cartItemId, newQuantity) {
  const quantity = parseInt(newQuantity, 10)

  if (Number.isNaN(quantity) || quantity < 1) {
    showToast('La cantidad debe ser al menos 1', 'error')
    loadCart()
    return
  }

  const formData = new FormData()
  formData.append('id', cartItemId)
  formData.append('cantidad', quantity)

  try {
    const response = await fetch('../controllers/carrito.php?action=update', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    if (data.success) {
      loadCart()
      loadCartCount()
    } else {
      showToast(data.message || 'Error al actualizar la cantidad', 'error')
      loadCart()
    }
  } catch (error) {
    console.log('Error actualizando la cantidad:', error)
    showToast('Error al actualizar la cantidad', 'error')
  }
}

function handleQuantityChange(cartItemId, value) {
  updateCartQuantity(cartItemId, value)
}

async function removeFromCart(id) {
  showConfirm('¿Seguro que deseas eliminar este producto del carrito?', async () => {
    const formData = new FormData()
    formData.append('id', id)

    try {
      const response = await fetch('../controllers/carrito.php?action=remove', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (data.success) {
        loadCart()
        loadCartCount()
      } else {
        showToast(data.message || 'Error al eliminar', 'error')
      }
    } catch (error) {
      console.log('Error eliminando del carrito:', error)
    }
  })
}

async function clearCart(skipConfirm = false) {
  const doClear = async () => {
    try {
      const response = await fetch('../controllers/carrito.php?action=clear', {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        loadCart()
        loadCartCount()
      } else {
        showToast(data.message || 'No se pudo vaciar el carrito', 'error')
      }
    } catch (error) {
      console.log('Error vaciando el carrito:', error)
    }
  }

  if (skipConfirm) {
    await doClear()
    return
  }

  return new Promise((resolve) => {
    showConfirm('¿Seguro que deseas vaciar el carrito?', async () => {
      await doClear()
      resolve()
    }, () => {
      resolve()
    })
  })
}

function checkout() {
  window.location.href = 'pago.html'
}

document.addEventListener('DOMContentLoaded', () => {
  applyCartTexts()
  checkUserAuth()
  loadCart()
})

document.addEventListener('idioma-cambiado', () => {
  applyCartTexts()
  loadCart()
})
