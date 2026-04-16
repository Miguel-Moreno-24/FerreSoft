let currentUser = null
const THEME_STORAGE_KEY = 'ferresoft.theme'
const LANGUAGE_STORAGE_KEY = 'ferresoft.language'

const translations = {
  es: {
    'menu.account': 'Mi Cuenta',
    'menu.admin': 'Panel de Administración',
    'menu.history': 'Historial de compras',
    'menu.settings': 'Configuración',
    'menu.logout': 'Cerrar Sesión',
    'menu.login': 'Iniciar Sesión',
    'menu.register': 'Registrarse',
    'menu.user': 'Usuario',
    'common.loading': 'Cargando...',
    'common.close': 'Cerrar',
    'common.cancel': 'Cancelar',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.backToStore': 'Volver a la Tienda',
    'cart.button': 'Carrito',
    'cart.add': 'Agregar al Carrito',
    'cart.view': 'Ver en la tienda',
    'cart.emptyContinue': 'Ir a Comprar',
    'cart.loginRequired': 'Debes iniciar sesión para ver el carrito',
    'cart.keepBrowsing': 'Puedes seguir viendo los productos',
    'cart.addSuccess': 'Producto agregado al carrito',
    'cart.addError': 'Error al agregar al carrito',
    'cart.loadError': 'Error al cargar los productos',
    'cart.noProducts': 'No hay productos disponibles',
    'cart.invalidQuantity': 'Cantidad inválida. Ingresa un número mayor o igual a 1.',
    'cart.invalidQuantityMax': 'Cantidad inválida. Ingresa un número entre 1 y {max}.',
    'cart.removeConfirm': '¿Seguro que deseas eliminar este producto del carrito?',
    'cart.clearConfirm': '¿Seguro que deseas vaciar el carrito?',
    'confirm.logout': '¿Seguro que deseas cerrar sesión?',
    'login.go': 'Ir al Inicio de Sesión',
    'login.stay': 'Quedarse en la página',
    'login.requiredToAdd': 'Debes iniciar sesión para agregar productos al carrito',
    'product.notFound': 'Producto no encontrado',
    'product.loadError': 'Error al cargar el producto',
    'product.stock': 'Stock: {stock} unidades',
    'store.welcome': 'Bienvenidos a FerreSoft',
    'store.subtitle': 'Las mejores herramientas para tus proyectos',
    'store.products': 'Nuestros Productos',
    'theme.updated': 'Tema actualizado',
    'theme.saveError': 'Error al guardar el tema',
    'theme.loadError': 'Error al cargar la preferencia de tema',
    'language.updated': 'Idioma actualizado',
    'language.saveError': 'Error al guardar el idioma',
  },
  en: {
    'menu.account': 'My Account',
    'menu.admin': 'Admin Panel',
    'menu.history': 'Purchase History',
    'menu.settings': 'Settings',
    'menu.logout': 'Log Out',
    'menu.login': 'Log In',
    'menu.register': 'Sign Up',
    'menu.user': 'User',
    'common.loading': 'Loading...',
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.backToStore': 'Back to Store',
    'cart.button': 'Cart',
    'cart.add': 'Add to Cart',
    'cart.view': 'View in Store',
    'cart.emptyContinue': 'Start Shopping',
    'cart.loginRequired': 'You need to log in to open the cart',
    'cart.keepBrowsing': 'You can keep browsing the store',
    'cart.addSuccess': 'Product added to cart',
    'cart.addError': 'Could not add the product to the cart',
    'cart.loadError': 'Could not load the products',
    'cart.noProducts': 'No products available',
    'cart.invalidQuantity': 'Invalid quantity. Enter a number greater than or equal to 1.',
    'cart.invalidQuantityMax': 'Invalid quantity. Enter a number between 1 and {max}.',
    'cart.removeConfirm': 'Do you want to remove this product from the cart?',
    'cart.clearConfirm': 'Do you want to empty the cart?',
    'confirm.logout': 'Do you want to log out?',
    'login.go': 'Go to Login',
    'login.stay': 'Stay on this page',
    'login.requiredToAdd': 'You need to log in to add products to the cart',
    'product.notFound': 'Product not found',
    'product.loadError': 'Error loading the product',
    'product.stock': 'Stock: {stock} units',
    'store.welcome': 'Welcome to FerreSoft',
    'store.subtitle': 'The best tools for your projects',
    'store.products': 'Our Products',
    'theme.updated': 'Theme updated',
    'theme.saveError': 'Could not save the theme',
    'theme.loadError': 'Could not load theme preference',
    'language.updated': 'Language updated',
    'language.saveError': 'Could not save the language',
  },
}

function getStoredLanguage() {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return stored === 'en' ? 'en' : 'es'
}

function getCurrentLanguage() {
  return document.documentElement.getAttribute('lang') === 'en' ? 'en' : getStoredLanguage()
}

function translate(key, vars = {}) {
  const language = getCurrentLanguage()
  const template = translations[language]?.[key] ?? translations.es?.[key] ?? key
  return template.replace(/\{(\w+)\}/g, (_, variable) => String(vars[variable] ?? ''))
}

function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = translate(element.dataset.i18n)
  })

  root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.setAttribute('placeholder', translate(element.dataset.i18nPlaceholder))
  })

  root.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.setAttribute('title', translate(element.dataset.i18nTitle))
  })
}

function setLanguage(language = 'es', persistLocal = true) {
  const normalized = language === 'en' ? 'en' : 'es'
  document.documentElement.setAttribute('lang', normalized)
  if (persistLocal) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized)
  }
  applyTranslations()
  document.dispatchEvent(new CustomEvent('idioma-cambiado', { detail: { language: normalized } }))
}

function resetLanguageToDefault() {
  localStorage.removeItem(LANGUAGE_STORAGE_KEY)
  document.documentElement.setAttribute('lang', 'es')
  applyTranslations()
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload()
  }
})

if (window.performance) {
  if (window.performance.navigation && window.performance.navigation.type === 2) {
    window.location.reload()
  }
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    container.className = 'toast-container'
    document.body.appendChild(container)
  }

  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  container.appendChild(toast)
  setTimeout(() => toast.classList.add('show'), 10)
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 200)
  }, 2500)
}

function resolveImagePath(path) {
  if (!path) return ''
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path

  const normalized = path.replace(/^\/+/, '')
  const currentPath = window.location.pathname
  const appBase = currentPath.includes('/views/')
    ? currentPath.slice(0, currentPath.indexOf('/views/'))
    : currentPath.substring(0, currentPath.lastIndexOf('/'))

  if (path.startsWith('/')) {
    if (path.startsWith(appBase + '/')) return path
    return `${appBase}/${normalized}`
  }

  return `${appBase}/${normalized}`
}

function applyTheme(theme = 'light') {
  const normalized = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', normalized)
  localStorage.setItem(THEME_STORAGE_KEY, normalized)
}

function resetThemeToDefault() {
  localStorage.removeItem(THEME_STORAGE_KEY)
  document.documentElement.setAttribute('data-theme', 'light')
}

async function logoutUser(redirectTo = 'login.html') {
  try {
    await fetch('../controllers/auth.php?action=logout')
  } catch (error) {
    console.log('Error cerrando sesión:', error)
  } finally {
    currentUser = null
    resetThemeToDefault()
    resetLanguageToDefault()
    window.location.href = redirectTo
  }
}

function showConfirm(message, onYes, onNo) {
  let modal = document.getElementById('confirm-modal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'confirm-modal'
    modal.className = 'modal'
    modal.innerHTML = `
      <div class="modal-content">
        <p id="confirm-message"></p>
        <div class="modal-actions">
          <button id="confirm-yes" class="btn btn-success">${translate('common.yes')}</button>
          <button id="confirm-no" class="btn">${translate('common.no')}</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }

  const msgEl = modal.querySelector('#confirm-message')
  const yesBtn = modal.querySelector('#confirm-yes')
  const noBtn = modal.querySelector('#confirm-no')

  yesBtn.textContent = translate('common.yes')
  noBtn.textContent = translate('common.no')
  msgEl.textContent = message

  const cleanup = () => {
    modal.classList.remove('active')
    yesBtn.onclick = null
    noBtn.onclick = null
    modal.onclick = null
  }

  yesBtn.onclick = () => {
    cleanup()
    onYes && onYes()
  }
  noBtn.onclick = () => {
    cleanup()
    onNo && onNo()
  }
  modal.onclick = (event) => {
    if (event.target === modal) {
      cleanup()
      onNo && onNo()
    }
  }

  modal.classList.add('active')
}

function showLoginConfirm(message, onLogin, onStay) {
  let modal = document.getElementById('login-confirm-modal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'login-confirm-modal'
    modal.className = 'modal'
    modal.innerHTML = `
      <div class="modal-content">
        <p id="login-confirm-message"></p>
        <div class="modal-actions">
          <button id="login-confirm-go" class="btn btn-success"></button>
          <button id="login-confirm-stay" class="btn"></button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }

  const msgEl = modal.querySelector('#login-confirm-message')
  const goBtn = modal.querySelector('#login-confirm-go')
  const stayBtn = modal.querySelector('#login-confirm-stay')

  goBtn.textContent = translate('login.go')
  stayBtn.textContent = translate('login.stay')
  msgEl.textContent = message

  const cleanup = () => {
    modal.classList.remove('active')
    goBtn.onclick = null
    stayBtn.onclick = null
    modal.onclick = null
  }

  goBtn.onclick = () => {
    cleanup()
    onLogin && onLogin()
  }
  stayBtn.onclick = () => {
    cleanup()
    onStay && onStay()
  }
  modal.onclick = (event) => {
    if (event.target === modal) {
      cleanup()
      onStay && onStay()
    }
  }

  modal.classList.add('active')
}

function renderUserMenu(user) {
  const menuNameEl = document.getElementById('user-menu-name')
  const userMenu = document.getElementById('user-menu')
  if (!userMenu) return

  if (menuNameEl) {
    menuNameEl.textContent = user ? user.nombre : translate('menu.user')
  }

  if (user) {
    const rolLower = String(user.rol || '').toLowerCase()
    const historyOrAdmin = rolLower.startsWith('admin')
      ? `<a href="admin.html" class="menu-item">${translate('menu.admin')}</a>`
      : `<a href="historial.html" class="menu-item">${translate('menu.history')}</a>`

    userMenu.innerHTML = `
      <a href="cuenta.html" class="menu-item">${translate('menu.account')}</a>
      ${historyOrAdmin}
      <a href="configuracion.html" class="menu-item">${translate('menu.settings')}</a>
      <a href="#" class="menu-item" id="logout-menu-link">${translate('menu.logout')}</a>
    `

    const logoutLink = userMenu.querySelector('#logout-menu-link')
    if (logoutLink) {
      logoutLink.addEventListener('click', (event) => {
        event.preventDefault()
        showConfirm(translate('confirm.logout'), async () => {
          await logoutUser()
        })
      })
    }
  } else {
    userMenu.innerHTML = `
      <a href="login.html" class="menu-item">${translate('menu.login')}</a>
      <a href="login.html?mode=register" class="menu-item">${translate('menu.register')}</a>
      <a href="configuracion.html" class="menu-item">${translate('menu.settings')}</a>
    `
  }
}

async function checkUserSession() {
  try {
    const response = await fetch('../controllers/auth.php?action=check')
    const data = await response.json()

    if (data.logged_in) {
      currentUser = data.user
      applyTheme(data.user.theme_preference || 'light')
      setLanguage(data.user.language_preference || getStoredLanguage())
      renderUserMenu(data.user)
      loadCartCount()
    } else {
      currentUser = null
      resetThemeToDefault()
      resetLanguageToDefault()
      renderUserMenu(null)
    }
  } catch (error) {
    console.log('Error comprobando la sesión:', error)
  }
}

function setupUserMenu() {
  const menuBtn = document.getElementById('user-menu-btn')
  const userMenu = document.getElementById('user-menu')

  if (!menuBtn || !userMenu) return
  if (menuBtn.dataset.menuBound === 'true') return
  menuBtn.dataset.menuBound = 'true'

  menuBtn.addEventListener('click', (event) => {
    event.stopPropagation()
    userMenu.classList.toggle('hidden')
  })

  document.addEventListener('click', (event) => {
    if (!menuBtn.contains(event.target) && !userMenu.contains(event.target)) {
      userMenu.classList.add('hidden')
    }
  })
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
  showConfirm(translate('confirm.logout'), async () => {
    await logoutUser()
  })
})

async function loadCartCount() {
  try {
    const response = await fetch('../controllers/carrito.php?action=list')
    const data = await response.json()
    if (!data.success) return

    const count = data.items.reduce((total, item) => total + Number(item.cantidad || 0), 0)
    const cartCount = document.getElementById('cart-count')
    if (cartCount) {
      cartCount.textContent = count
    }
  } catch (error) {
    console.log('Error cargando el contador del carrito:', error)
  }
}

async function addToCart(productoId, maxStock = null, cantidadOverride = null) {
  if (!currentUser) {
    showLoginConfirm(translate('login.requiredToAdd'), () => {
      window.location.href = 'login.html'
    })
    return
  }

  const limite = Number.isFinite(Number(maxStock)) && maxStock !== null ? Number(maxStock) : null

  const enviarPedido = async (cantidad) => {
    const formData = new FormData()
    formData.append('producto_id', productoId)
    formData.append('cantidad', cantidad)

    try {
      const response = await fetch('../controllers/carrito.php?action=add', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (data.success) {
        showToast(translate('cart.addSuccess'), 'success')
        loadCartCount()
      } else {
        showToast(data.message || translate('cart.addError'), 'error')
      }
    } catch (error) {
      console.log('Error agregando al carrito:', error)
      showToast(translate('cart.addError'), 'error')
    }
  }

  if (cantidadOverride !== null && cantidadOverride !== undefined) {
    const valor = parseInt(String(cantidadOverride), 10)
    if (Number.isNaN(valor) || valor < 1 || (limite !== null && valor > limite)) {
      showToast(limite !== null ? translate('cart.invalidQuantityMax', { max: limite }) : translate('cart.invalidQuantity'), 'error')
      return
    }
    enviarPedido(valor)
  } else {
    showQuantityModal(limite, (valor) => {
      enviarPedido(valor)
    })
  }
}

function showQuantityModal(limite, onConfirm, onCancel) {
  const modal = document.getElementById('cantidad-modal')
  if (!modal) return

  const input = modal.querySelector('#cantidad-input')
  const confirmBtn = modal.querySelector('#cantidad-confirm-btn')
  const cancelBtn = modal.querySelector('#cantidad-cancel-btn')

  input.value = 1
  input.min = 1
  if (limite !== null && !Number.isNaN(limite)) {
    input.max = limite
  } else {
    input.removeAttribute('max')
  }

  confirmBtn.textContent = translate('common.yes')
  cancelBtn.textContent = translate('common.cancel')

  const cleanup = () => {
    modal.classList.remove('active')
    confirmBtn.onclick = null
    cancelBtn.onclick = null
    modal.onclick = null
  }

  confirmBtn.onclick = () => {
    const valor = parseInt(input.value, 10)
    if (Number.isNaN(valor) || valor < 1 || (limite !== null && valor > limite)) {
      showToast(limite !== null ? translate('cart.invalidQuantityMax', { max: limite }) : translate('cart.invalidQuantity'), 'error')
      return
    }
    cleanup()
    onConfirm(valor)
  }

  cancelBtn.onclick = () => {
    cleanup()
    if (onCancel) onCancel()
  }

  modal.onclick = (event) => {
    if (event.target === modal) {
      cleanup()
      if (onCancel) onCancel()
    }
  }

  modal.classList.add('active')
}

async function cargarProductos() {
  const contenedor = document.getElementById('productos-container')
  if (!contenedor) return

  try {
    const response = await fetch('../controllers/productos.php')
    const productos = await response.json()

    if (productos.length === 0) {
      contenedor.innerHTML = `<p class="error">${translate('cart.noProducts')}</p>`
      return
    }

    contenedor.innerHTML = ''

    productos.forEach((producto) => {
      const card = document.createElement('div')
      card.className = 'producto-card'
      card.innerHTML = `
        <div class="image-wrapper">
          <a href="index.html?producto=${producto.id}" onclick="openProductModal(${producto.id}); return false;">
            <img src="${resolveImagePath(producto.imagen)}" alt="${producto.nombre}">
          </a>
        </div>
        <h4><a href="index.html?producto=${producto.id}" onclick="openProductModal(${producto.id}); return false;" style="color: inherit; text-decoration: none;">${producto.nombre}</a></h4>
        <p class="producto-descripcion">${producto.descripcion}</p>
        <p class="precio">$${Number.parseFloat(producto.precio).toFixed(2)}</p>
        <p class="stock">${translate('product.stock', { stock: producto.stock })}</p>
        <button class="product-add-btn" onclick="addToCart(${producto.id}, ${producto.stock})" ${producto.stock <= 0 ? 'disabled' : ''}>${translate('cart.add')}</button>
      `
      contenedor.appendChild(card)
    })

    maybeOpenProductFromQuery()
  } catch (error) {
    console.log('Error al cargar productos:', error)
    contenedor.innerHTML = `<p class="error">${translate('cart.loadError')}</p>`
  }
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light'
  document.documentElement.setAttribute('data-theme', savedTheme)
}

function applySavedLanguage() {
  setLanguage(getStoredLanguage(), false)
}

function maybeOpenProductFromQuery() {
  const pageHasProducts = document.getElementById('productos-container')
  if (!pageHasProducts) return

  const params = new URLSearchParams(window.location.search)
  const productId = parseInt(params.get('producto') || '', 10)
  if (!Number.isNaN(productId) && productId > 0) {
    openProductModal(productId)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applySavedTheme()
  applySavedLanguage()
  checkUserSession()
  setupUserMenu()

  const cartBtn = document.querySelector('.cart-btn')
  if (cartBtn) {
    cartBtn.addEventListener('click', (event) => {
      event.preventDefault()
      if (currentUser) {
        window.location.href = 'carrito.html'
      } else {
        showLoginConfirm(translate('cart.loginRequired'), () => {
          window.location.href = 'login.html'
        }, () => {
          showToast(translate('cart.keepBrowsing'), 'info')
        })
      }
    })
  }

  if (document.getElementById('productos-container')) {
    cargarProductos()
  }
})

async function openProductModal(id, readOnly = false) {
  try {
    const response = await fetch(`../controllers/productos.php?action=get&id=${encodeURIComponent(id)}`)
    const data = await response.json()
    if (!data.success) {
      showToast(data.message || translate('product.notFound'), 'error')
      return
    }

    const product = data.product
    const modal = document.getElementById('detalle-modal')
    if (!modal) return

    document.getElementById('detalle-nombre').textContent = product.nombre
    document.getElementById('detalle-imagen').src = resolveImagePath(product.imagen)
    document.getElementById('detalle-imagen').alt = product.nombre
    document.getElementById('detalle-descripcion').textContent = product.descripcion || ''
    document.getElementById('detalle-precio').textContent = `$${Number.parseFloat(product.precio).toFixed(2)}`
    document.getElementById('detalle-stock').textContent = translate('product.stock', { stock: product.stock })

    const qty = document.getElementById('detalle-cantidad')
    qty.value = 1
    qty.min = 1
    if (product.stock > 0) {
      qty.max = product.stock
      qty.disabled = false
      document.getElementById('detalle-add-btn').disabled = false
    } else {
      qty.disabled = true
      document.getElementById('detalle-add-btn').disabled = true
    }

    let zoomLevel = 1
    const img = document.getElementById('detalle-imagen')
    const wrapper = document.querySelector('.product-image-wrapper')

    const wheelHandler = (event) => {
      event.preventDefault()
      if (event.deltaY < 0) {
        if (zoomLevel < 3) zoomLevel += 0.1
      } else if (zoomLevel > 0.5) {
        zoomLevel -= 0.1
      }
      img.style.transform = `scale(${zoomLevel})`
    }

    if (wrapper) {
      wrapper.addEventListener('wheel', wheelHandler, { passive: false })
      modal._cleanupZoom = () => {
        wrapper.removeEventListener('wheel', wheelHandler)
        zoomLevel = 1
        img.style.transform = 'scale(1)'
      }
    }

    const addBtn = document.getElementById('detalle-add-btn')
    const closeBtn = document.getElementById('detalle-cerrar-btn')
    if (closeBtn) {
      closeBtn.textContent = translate('common.close')
    }
    if (addBtn) {
      addBtn.textContent = translate('cart.add')
    }

    if (readOnly) {
      addBtn.style.display = 'none'
      qty.style.display = 'none'
    } else {
      addBtn.style.display = 'inline-block'
      qty.style.display = 'inline-block'
      addBtn.onclick = () => {
        const cantidad = parseInt(qty.value, 10)
        addToCart(product.id, product.stock, cantidad)
      }
    }

    closeBtn.onclick = closeProductModal
    modal.classList.add('active')
    modal.onclick = (event) => {
      if (event.target === modal) closeProductModal()
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get('producto') !== String(id)) {
      params.set('producto', String(id))
      const nextUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState({}, '', nextUrl)
    }
  } catch (error) {
    showToast(translate('product.loadError'), 'error')
  }
}

function closeProductModal() {
  const modal = document.getElementById('detalle-modal')
  if (modal) {
    modal.classList.remove('active')
    if (modal._cleanupZoom) {
      modal._cleanupZoom()
      delete modal._cleanupZoom
    }
  }

  const params = new URLSearchParams(window.location.search)
  if (params.has('producto')) {
    params.delete('producto')
    const query = params.toString()
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
    window.history.replaceState({}, '', nextUrl)
  }
}
