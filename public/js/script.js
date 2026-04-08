let currentUser = null

// Evitar que usar "atrás" muestre caché obsoleta (falsa sensación de que no se guardó)
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.location.reload()
  }
})

if (window.performance) {
  if (window.performance.navigation && window.performance.navigation.type === 2) {
    window.location.reload()
  }
}

function showToast(message, type = "success") {
  let container = document.getElementById("toast-container")
  if (!container) {
    container = document.createElement("div")
    container.id = "toast-container"
    container.className = "toast-container"
    document.body.appendChild(container)
  }
  const toast = document.createElement("div")
  toast.className = `toast toast-${type}`
  toast.textContent = message
  container.appendChild(toast)
  setTimeout(() => toast.classList.add("show"), 10)
  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => toast.remove(), 200)
  }, 2500)
}

function resolveImagePath(path) {
  if (!path) return ""
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path

  const normalized = path.replace(/^\/+/, "")
  const currentPath = window.location.pathname
  const appBase = currentPath.includes("/views/")
    ? currentPath.slice(0, currentPath.indexOf("/views/"))
    : currentPath.substring(0, currentPath.lastIndexOf("/"))

  if (path.startsWith("/")) {
    if (path.startsWith(appBase + "/")) return path
    return `${appBase}/${normalized}`
  }

  return `${appBase}/${normalized}`
}

// ayuda para modal de confirmación (sí / no)
function showConfirm(message, onYes, onNo) {
  let modal = document.getElementById("confirm-modal")
  if (!modal) {
    modal = document.createElement("div")
    modal.id = "confirm-modal"
    modal.className = "modal"
    modal.innerHTML = `
      <div class="modal-content">
        <p id="confirm-message"></p>
        <div class="modal-actions">
          <button id="confirm-yes" class="btn btn-success">Sí</button>
          <button id="confirm-no" class="btn">No</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }
  const msgEl = modal.querySelector("#confirm-message")
  const yesBtn = modal.querySelector("#confirm-yes")
  const noBtn = modal.querySelector("#confirm-no")

  msgEl.textContent = message

  const cleanup = () => {
    modal.classList.remove("active")
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
  modal.onclick = (e) => {
    if (e.target === modal) {
      cleanup()
      onNo && onNo()
    }
  }

  modal.classList.add("active")
}

// modal para confirmar inicio de sesión (con botones personalizados)
function showLoginConfirm(message, onLogin, onStay) {
  let modal = document.getElementById("login-confirm-modal")
  if (!modal) {
    modal = document.createElement("div")
    modal.id = "login-confirm-modal"
    modal.className = "modal"
    modal.innerHTML = `
      <div class="modal-content">
        <p id="login-confirm-message"></p>
        <div class="modal-actions">
          <button id="login-confirm-go" class="btn btn-success">Ir al Inicio de Sesión</button>
          <button id="login-confirm-stay" class="btn">Quedarse en la página</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }
  const msgEl = modal.querySelector("#login-confirm-message")
  const goBtn = modal.querySelector("#login-confirm-go")
  const stayBtn = modal.querySelector("#login-confirm-stay")

  msgEl.textContent = message

  const cleanup = () => {
    modal.classList.remove("active")
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
  modal.onclick = (e) => {
    if (e.target === modal) {
      cleanup()
      onStay && onStay()
    }
  }

  modal.classList.add("active")
}

async function checkUserSession() {
  try {
    const response = await fetch("../controllers/auth.php?action=check")
    const data = await response.json()

    const menuBtn = document.getElementById("user-menu-btn")
    const menuNameEl = document.getElementById("user-menu-name")
    const userMenu = document.getElementById("user-menu")
    const adminPanelLink = document.getElementById("admin-panel-link")
    const logoutMenuLink = document.getElementById("logout-menu-link")

    if (data.logged_in) {
      currentUser = data.user
      if (menuNameEl) {
        menuNameEl.textContent = data.user.nombre
      }
      if (menuBtn) {
        menuBtn.style.color = "inherit"
      }

      // Actualizar opciones del menú según rol
      if (userMenu) {
        const rolLower = String(data.user.rol).toLowerCase()
        let menuHTML = `<a href="cuenta.html" class="menu-item">Mi Cuenta</a>`
        
        if (rolLower.startsWith("admin")) {
          menuHTML += `<a href="admin.html" class="menu-item">Panel Admin</a>`
        } else {
          menuHTML += `<a href="historial.html" class="menu-item">Historial de compras</a>`
        }
        
        menuHTML += `
          <a href="configuracion.html" class="menu-item">Configuración</a>
          <a href="#" class="menu-item" id="logout-menu-link">Cerrar Sesión</a>
        `
        userMenu.innerHTML = menuHTML
        
        // Re-vincular evento de logout
        const newLogoutLink = userMenu.querySelector("#logout-menu-link")
        if (newLogoutLink) {
          newLogoutLink.addEventListener("click", (e) => {
            e.preventDefault()
            showConfirm("¿Seguro que deseas cerrar sesión?", async () => {
              try {
                await fetch("../controllers/auth.php?action=logout")
                window.location.href = "login.html"
              } catch (error) {
                console.log("Error logging out:", error)
              }
            })
          })
        }
      }

      loadCartCount()
    } else {
      // Usuario no logueado: mostrar opciones básicas
      currentUser = null
      if (menuBtn) {
        menuBtn.style.color = "#999"
      }
      if (menuNameEl) {
        menuNameEl.textContent = "Usuario"
      }
      
      if (userMenu) {
        userMenu.innerHTML = `
          <a href="login.html" class="menu-item">Iniciar Sesión</a>
          <a href="login.html?mode=register" class="menu-item">Registrarse</a>
          <a href="configuracion.html" class="menu-item">Configuración</a>
        `
      }
    }
  } catch (error) {
    console.log("[v0] Error checking session:", error)
  }
}

// Manejar menú desplegable de usuario
function setupUserMenu() {
  const menuBtn = document.getElementById("user-menu-btn")
  const userMenu = document.getElementById("user-menu")

  if (!menuBtn || !userMenu) return

  // Toggle menú al hacer click en botón
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    userMenu.classList.toggle("hidden")
  })

  // Cerrar menú si se hace click fuera
  document.addEventListener("click", (e) => {
    if (!menuBtn.contains(e.target) && !userMenu.contains(e.target)) {
      userMenu.classList.add("hidden")
    }
  })
}

document.getElementById("logout-btn")?.addEventListener("click", () => {
  showConfirm("¿Seguro que deseas cerrar sesión?", async () => {
    try {
      await fetch("../controllers/auth.php?action=logout")
      window.location.href = "login.html"
    } catch (error) {
      console.log("[v0] Error logging out:", error)
    }
  })
})

async function loadCartCount() {
  try {
    const response = await fetch("../controllers/carrito.php?action=list")
    const data = await response.json()

    if (data.success) {
      const count = data.items.length
      document.getElementById("cart-count").textContent = count
    }
  } catch (error) {
    console.log("[v0] Error loading cart count:", error)
  }
}

async function addToCart(productoId, maxStock = null, cantidadOverride = null) {
  if (!currentUser) {
    // Mostrar modal de confirmación en lugar de redirigir directamente
    showLoginConfirm(
      "Debes iniciar sesión para agregar productos al carrito",
      () => {
        window.location.href = "login.html"
      },
      () => {
        // Usuario hizo clic en "Quedarse", no hacer nada
      }
    )
    return
  }

  const limite = Number.isFinite(Number(maxStock)) && maxStock !== null ? Number(maxStock) : null

  // función interna para enviar la petición una vez tengamos la cantidad
  const enviarPedido = async (cantidad) => {
    const formData = new FormData()
    formData.append("producto_id", productoId)
    formData.append("cantidad", cantidad)

    try {
      const response = await fetch("../controllers/carrito.php?action=add", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        showToast("Producto agregado al carrito", "success")
        loadCartCount()
      } else {
        showToast(data.message || "No se pudo agregar al carrito", "error")
      }
    } catch (error) {
      console.log("[v0] Error adding to cart:", error)
      showToast("Error al agregar al carrito", "error")
    }
  }

  if (cantidadOverride !== null && cantidadOverride !== undefined) {
    const valor = parseInt(String(cantidadOverride), 10)
    if (Number.isNaN(valor) || valor < 1 || (limite !== null && valor > limite)) {
      showToast(limite ? `Cantidad inválida. Ingresa un número entre 1 y ${limite}.` : "Cantidad inválida. Ingresa un número mayor o igual a 1.", "error")
      return
    }
    enviarPedido(valor)
  } else {
    // pedir cantidad mediante un modal propio
    showQuantityModal(limite, (val) => {
      enviarPedido(val)
    })
  }
}

// helpers de modal de cantidad
function showQuantityModal(limite, onConfirm, onCancel) {
  const modal = document.getElementById("cantidad-modal")
  if (!modal) return
  const input = modal.querySelector("#cantidad-input")
  const confirmBtn = modal.querySelector("#cantidad-confirm-btn")
  const cancelBtn = modal.querySelector("#cantidad-cancel-btn")

  input.value = 1
  input.min = 1
  if (limite !== null && !isNaN(limite)) {
    input.max = limite
  } else {
    input.removeAttribute("max")
  }

  const cleanup = () => {
    modal.classList.remove("active")
    confirmBtn.onclick = null
    cancelBtn.onclick = null
    modal.onclick = null
  }

  confirmBtn.onclick = () => {
    const valor = parseInt(input.value, 10)
    if (Number.isNaN(valor) || valor < 1 || (limite !== null && valor > limite)) {
      showToast(limite ? `Cantidad inválida. Ingresa un número entre 1 y ${limite}.` : "Cantidad inválida. Ingresa un número mayor o igual a 1.", "error")
      return
    }
    cleanup()
    onConfirm(valor)
  }

  cancelBtn.onclick = () => {
    cleanup()
    if (onCancel) onCancel()
  }

  modal.onclick = (e) => {
    if (e.target === modal) {
      cleanup()
      if (onCancel) onCancel()
    }
  }

  modal.classList.add("active")
}

async function cargarProductos() {
  const contenedor = document.getElementById("productos-container")

  try {
    const response = await fetch("../controllers/productos.php")
    const productos = await response.json()

    if (productos.length === 0) {
      contenedor.innerHTML = '<p class="error">No hay productos disponibles</p>'
      return
    }

    contenedor.innerHTML = ""

    productos.forEach((producto) => {
      const card = document.createElement("div")
      card.className = "producto-card"
      card.innerHTML = `
                <div class="image-wrapper">
                  <a href="producto.html?id=${producto.id}" onclick="openProductModal(${producto.id}); return false;">
                    <img src="${resolveImagePath(producto.imagen)}" alt="${producto.nombre}">
                  </a>
                </div>
                <h4><a href="producto.html?id=${producto.id}" onclick="openProductModal(${producto.id}); return false;" style="color: inherit; text-decoration: none;">${producto.nombre}</a></h4>
                <p class="producto-descripcion">${producto.descripcion}</p>
                <p class="precio">$${Number.parseFloat(producto.precio).toFixed(2)}</p>
                <p class="stock">Stock: ${producto.stock} unidades</p>
                <button class="product-add-btn" onclick="addToCart(${producto.id}, ${producto.stock})"${producto.stock <= 0 ? ' disabled' : ''}>Agregar al Carrito</button>
            `
      contenedor.appendChild(card)
    })
  } catch (error) {
    console.log("[v0] Error al cargar productos:", error)
    contenedor.innerHTML = '<p class="error">Error al cargar los productos</p>'
  }
}

// Manejar tema al cargar la página
function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme()
  checkUserSession()
  setupUserMenu()

  const cartBtn = document.querySelector(".cart-btn")
  if (cartBtn) {
    cartBtn.addEventListener("click", (e) => {
      e.preventDefault()
      if (currentUser) {
        window.location.href = "carrito.html"
      } else {
        showLoginConfirm(
          "Debes iniciar sesión para ver el carrito",
          () => {
            window.location.href = "login.html"
          },
          () => {
            showToast("Puedes seguir viendo los productos", "info")
          }
        )
      }
    })
  }

  if (document.getElementById("productos-container")) {
    cargarProductos()
  }
})

async function openProductModal(id, readOnly = false) {
  try {
    const resp = await fetch(`../controllers/productos.php?action=get&id=${encodeURIComponent(id)}`)
    const data = await resp.json()
    if (!data.success) {
      showToast(data.message || "Producto no encontrado", "error")
      return
    }
    const p = data.product
    const modal = document.getElementById("detalle-modal")
    document.getElementById("detalle-nombre").textContent = p.nombre
    document.getElementById("detalle-imagen").src = resolveImagePath(p.imagen)
    document.getElementById("detalle-imagen").alt = p.nombre
    document.getElementById("detalle-descripcion").textContent = p.descripcion || ""
    document.getElementById("detalle-precio").textContent = `$${Number.parseFloat(p.precio).toFixed(2)}`
    document.getElementById("detalle-stock").textContent = `Stock: ${p.stock} unidades`
    const qty = document.getElementById("detalle-cantidad")
    qty.value = 1
    qty.min = 1
    if (p.stock > 0) {
      qty.max = p.stock
      qty.disabled = false
      document.getElementById("detalle-add-btn").disabled = false
    } else {
      qty.disabled = true
      document.getElementById("detalle-add-btn").disabled = true
    }
    
    // Zoom con la rueda del ratón (sin botones visibles)
    let zoomLevel = 1
    const img = document.getElementById("detalle-imagen")
    const wrapper = document.querySelector(".product-image-wrapper")

    const wheelHandler = (e) => {
      e.preventDefault()
      if (e.deltaY < 0) {
        if (zoomLevel < 3) zoomLevel += 0.1
      } else {
        if (zoomLevel > 0.5) zoomLevel -= 0.1
      }
      img.style.transform = `scale(${zoomLevel})`
    }
    wrapper.addEventListener("wheel", wheelHandler, { passive: false })

    // Guardar cleanup para que al cerrar el modal se quite el listener y se resetee el zoom
    modal._cleanupZoom = () => {
      wrapper.removeEventListener("wheel", wheelHandler)
      zoomLevel = 1
      img.style.transform = "scale(1)"
    }

    const addBtn = document.getElementById("detalle-add-btn")
    if (readOnly) {
      addBtn.style.display = "none"
      qty.style.display = "none"
    } else {
      addBtn.style.display = "inline-block"
      qty.style.display = "inline-block"
      addBtn.onclick = () => {
        const cantidad = parseInt(qty.value, 10)
        addToCart(p.id, p.stock, cantidad)
      }
    }

    const closeBtn = document.getElementById("detalle-cerrar-btn")
    closeBtn.onclick = closeProductModal
    modal.classList.add("active")
    modal.onclick = (e) => {
      if (e.target === modal) closeProductModal()
    }
  } catch (e) {
    showToast("Error al cargar el producto", "error")
  }
}

function closeProductModal() {
  const modal = document.getElementById("detalle-modal")
  if (modal) {
    modal.classList.remove("active")

    // Si el modal tenía un listener de zoom, elimínalo y restaura el estado
    if (modal._cleanupZoom) {
      modal._cleanupZoom()
      delete modal._cleanupZoom
    }
  }
}
