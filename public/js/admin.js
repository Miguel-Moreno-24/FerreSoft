let productosCache = []
let showRecentFirst = false

async function checkAdminAccess() {
  try {
    const response = await fetch("../controllers/auth.php?action=check")
    const data = await response.json()

    if (!data.logged_in || String(data.user.rol).toLowerCase() !== "admin") {
      showToast("Acceso denegado", "error")
      window.location.href = "login.html"
      return false
    }

    currentUser = data.user
    applyTheme(data.user.theme_preference || "light")
    const menuName = document.getElementById("user-menu-name")
    if (menuName) menuName.textContent = data.user.nombre
    setupUserMenu()
    await checkUserSession()
    return true
  } catch (error) {
    window.location.href = "login.html"
    return false
  }
}

function sortProducts(list) {
  return [...list].sort((a, b) => (showRecentFirst ? b.id - a.id : a.id - b.id))
}

function getFilteredProducts() {
  const query = (document.getElementById("productos-search")?.value || "").trim().toLowerCase()
  const filtered = productosCache.filter((product) => {
    return [product.nombre, product.descripcion, String(product.id)].some((value) =>
      String(value || "").toLowerCase().includes(query)
    )
  })

  return sortProducts(filtered)
}

function updateOrderButtonLabel() {
  const button = document.getElementById("toggle-order-btn")
  if (!button) return
  button.textContent = showRecentFirst ? "Ver por ID" : "Ver mas recientes"
}

async function loadStats() {
  try {
    const response = await fetch("../controllers/admin_api.php?action=stats")
    const data = await response.json()
    if (!data.success) return

    document.getElementById("stat-productos").textContent = data.stats.productos
    document.getElementById("stat-usuarios").textContent = data.stats.usuarios
    document.getElementById("stat-pedidos").textContent = data.stats.pedidos
  } catch (error) {
    console.error("Error stats:", error)
  }
}

async function loadProducts() {
  const tbody = document.getElementById("productos-table")
  tbody.innerHTML = '<tr><td colspan="7" class="loading">Cargando...</td></tr>'

  try {
    const response = await fetch("../controllers/productos.php?action=list")
    const productos = await response.json()
    productosCache = Array.isArray(productos) ? productos : []
    renderProducts(getFilteredProducts())
  } catch (error) {
    console.error("Error products:", error)
    tbody.innerHTML = '<tr><td colspan="7" class="loading">No se pudieron cargar los productos.</td></tr>'
  }
}

function renderProducts(list) {
  const tbody = document.getElementById("productos-table")
  tbody.innerHTML = ""

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading">No se encontraron productos.</td></tr>'
    return
  }

  list.forEach((p) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${p.id}</td>
      <td><img src="${resolveImagePath(p.imagen)}" class="admin-product-thumb" alt="${p.nombre}"></td>
      <td>${p.nombre}</td>
      <td>${p.descripcion || "-"}</td>
      <td>$${Number(p.precio).toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>
        <div class="admin-table-actions">
          <button class="btn admin-secondary-btn admin-inline-btn" onclick="editProduct(${p.id})">Editar</button>
          <button class="btn btn-danger admin-inline-btn" onclick="deleteProduct(${p.id})">Eliminar</button>
        </div>
      </td>
    `
    tbody.appendChild(tr)
  })
}

function toggleRecentOrder() {
  showRecentFirst = !showRecentFirst
  updateOrderButtonLabel()
  renderProducts(getFilteredProducts())
}

async function resetCounters() {
  showConfirm("¿Reiniciar contadores vacios de productos y usuarios?", async () => {
    try {
      const response = await fetch("../controllers/productos.php?action=reset_ids", { method: "POST" })
      const data = await response.json()
      if (!data.success) {
        showToast(data.message || "No se pudo reiniciar", "error")
        return
      }

      showToast(data.message || "Contadores revisados", "success")
      loadStats()
      loadProducts()
    } catch (error) {
      console.error("Error reset counters:", error)
      showToast("Error al reiniciar contadores", "error")
    }
  })
}

async function loadPedidos() {
  const tbody = document.getElementById("pedidos-table")
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Cargando...</td></tr>'

  try {
    const response = await fetch("../controllers/admin_api.php?action=list_pedidos")
    const data = await response.json()
    if (!data.success) return

    tbody.innerHTML = ""
    data.pedidos.forEach((pedido) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>#${pedido.id}</td>
        <td>${pedido.usuario_nombre}<br><small>${pedido.usuario_email}</small></td>
        <td>${pedido.resumen_productos}</td>
        <td>$${Number(pedido.total).toFixed(2)}</td>
        <td>
          <select onchange="updatePedidoEstado(${pedido.id}, this.value)" class="estado-select">
            <option value="Pendiente" ${pedido.estado === "Pendiente" ? "selected" : ""}>Pendiente</option>
            <option value="Enviado" ${pedido.estado === "Enviado" ? "selected" : ""}>Enviado</option>
            <option value="Entregado" ${pedido.estado === "Entregado" ? "selected" : ""}>Entregado</option>
          </select>
        </td>
        <td>${new Date(pedido.fecha_pedido).toLocaleDateString()}</td>
      `
      tbody.appendChild(tr)
    })
  } catch (error) {
    console.error("Error pedidos:", error)
  }
}

async function updatePedidoEstado(id, estado) {
  const formData = new FormData()
  formData.append("id", id)
  formData.append("estado", estado)

  try {
    const response = await fetch("../controllers/admin_api.php?action=update_pedido", {
      method: "POST",
      body: formData,
    })
    const data = await response.json()
    if (data.success) showToast(data.message)
  } catch (error) {
    showToast("Error al actualizar", "error")
  }
}

async function loadUsuarios() {
  const tbody = document.getElementById("usuarios-table")
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Cargando...</td></tr>'

  try {
    const response = await fetch("../controllers/admin_api.php?action=list_usuarios")
    const data = await response.json()
    if (!data.success) return

    tbody.innerHTML = ""
    data.usuarios.forEach((user) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.nombre}</td>
        <td>${user.email}</td>
        <td>${user.rol}</td>
        <td>${new Date(user.fecha_registro).toLocaleDateString()}</td>
        <td><button class="btn btn-danger admin-inline-btn" onclick="deleteUsuario(${user.id})">Eliminar</button></td>
      `
      tbody.appendChild(tr)
    })
  } catch (error) {
    console.error("Error users:", error)
  }
}

async function deleteUsuario(id) {
  showConfirm("¿Seguro que deseas eliminar este usuario?", async () => {
    const formData = new FormData()
    formData.append("id", id)

    try {
      const response = await fetch("../controllers/admin_api.php?action=delete_usuario", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!data.success) {
        showToast(data.message, "error")
        return
      }

      showToast(data.message)
      loadUsuarios()
      loadStats()
    } catch (error) {
      showToast("Error al eliminar", "error")
    }
  })
}

function openModal(producto = null) {
  const modal = document.getElementById("producto-modal")
  const form = document.getElementById("producto-form")

  if (producto) {
    document.getElementById("modal-title").textContent = "Editar Producto"
    document.getElementById("producto-id").value = producto.id
    document.getElementById("producto-nombre").value = producto.nombre
    document.getElementById("producto-descripcion").value = producto.descripcion
    document.getElementById("producto-precio").value = producto.precio
    document.getElementById("producto-stock").value = producto.stock
    document.getElementById("producto-imagen").value = producto.imagen
  } else {
    document.getElementById("modal-title").textContent = "Agregar Producto"
    form.reset()
    document.getElementById("producto-id").value = ""
  }

  modal.classList.add("active")
}

function closeModal() {
  document.getElementById("producto-modal").classList.remove("active")
}

function editProduct(id) {
  const product = productosCache.find((item) => item.id == id)
  if (product) openModal(product)
}

async function deleteProduct(id) {
  showConfirm("¿Seguro que deseas eliminar este producto?", async () => {
    const formData = new FormData()
    formData.append("id", id)

    try {
      const response = await fetch("../controllers/productos.php?action=delete", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!data.success) {
        showToast(data.message || "No se pudo eliminar", "error")
        return
      }

      showToast("Producto eliminado")
      loadProducts()
      loadStats()
    } catch (error) {
      console.error("Error delete:", error)
    }
  })
}

document.getElementById("producto-form")?.addEventListener("submit", async (e) => {
  e.preventDefault()
  const id = document.getElementById("producto-id").value
  const formData = new FormData(e.target)
  if (id) formData.append("id", id)

  try {
    const action = id ? "update" : "add"
    const response = await fetch(`../controllers/productos.php?action=${action}`, {
      method: "POST",
      body: formData,
    })
    const data = await response.json()

    if (!data.success) {
      showToast(data.message, "error")
      return
    }

    showToast(data.message)
    closeModal()
    loadProducts()
    loadStats()
  } catch (error) {
    console.error("Error save:", error)
  }
})

document.addEventListener("DOMContentLoaded", async () => {
  updateOrderButtonLabel()

  const isAdmin = await checkAdminAccess()
  if (!isAdmin) return

  document.getElementById("productos-search")?.addEventListener("input", () => {
    renderProducts(getFilteredProducts())
  })

  loadStats()
  loadProducts()
  loadPedidos()
  loadUsuarios()
})
