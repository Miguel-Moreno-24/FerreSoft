async function checkUserAuth() {
  try {
    const response = await fetch("../controllers/auth.php?action=check")
    const data = await response.json()

    if (!data.logged_in) {
      showConfirm(
        "Debes iniciar sesión para ver el carrito. ¿Ir a inicio de sesión?",
        () => {
          window.location.href = "login.html"
        },
        () => {
          showToast("Continúa navegando por la tienda", "info")
        }
      )
    }
  } catch (error) {
    console.log("[v0] Error checking auth:", error)
    showConfirm(
      "No pudimos comprobar tu sesión. ¿Ir a inicio de sesión?",
      () => {
        window.location.href = "login.html"
      },
      () => {
        showToast("Continúa navegando por la tienda", "info")
      }
    )
  }
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

async function loadCart() {
  try {
    const response = await fetch("../controllers/carrito.php?action=list")
    const data = await response.json()

    const container = document.getElementById("cart-items")
    const summary = document.getElementById("cart-summary")

    if (!data.success || data.items.length === 0) {
      container.innerHTML =
        '<div class="empty-cart"><h3>Tu carrito está vacío</h3><a href="index.html" class="btn">Ir a Comprar</a></div>'
      summary.style.display = "none"
      return
    }

    container.innerHTML = ""

    data.items.forEach((item) => {
      const div = document.createElement("div")
      div.className = "cart-item"
      div.innerHTML = `
                <img src="${resolveImagePath(item.imagen)}" alt="${item.nombre}" style="cursor: pointer;" onclick="openProductModal(${item.producto_id}, true)">
                <div class="cart-item-info">
                    <h4><a href="#" onclick="event.preventDefault(); openProductModal(${item.producto_id}, true)">${item.nombre}</a></h4>
                    <p class="precio">$${Number.parseFloat(item.precio).toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.cantidad - 1})">−</button>
                        <input type="number" id="qty-${item.id}" class="qty-input-cart" value="${item.cantidad}" min="1" onchange="handleQuantityChange(${item.id}, this.value)" style="width: 50px; padding: 0.3rem; border: 1px solid #ddd; border-radius: 4px; text-align: center;">
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.cantidad + 1})">+</button>
                    </div>
                    <p class="precio" style="margin-top: 0.5rem;">$${Number.parseFloat(item.subtotal).toFixed(2)}</p>
                    <button class="btn btn-danger" onclick="removeFromCart(${item.id})">Eliminar</button>
                </div>
            `
      container.appendChild(div)
    })

    document.getElementById("cart-total").textContent = Number.parseFloat(data.total).toFixed(2)
    summary.style.display = "block"
  } catch (error) {
    console.log("[v0] Error loading cart:", error)
  }
}

async function updateCartQuantity(cartItemId, newQuantity) {
  const quantity = parseInt(newQuantity, 10)
  
  // Validar cantidad
  if (isNaN(quantity) || quantity < 1) {
    showToast("La cantidad debe ser al menos 1", "error")
    loadCart() // Recargar para restablecer la vista
    return
  }

  const formData = new FormData()
  formData.append("id", cartItemId)
  formData.append("cantidad", quantity)

  try {
    const response = await fetch("../controllers/carrito.php?action=update", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      loadCart()
    } else {
      showToast(data.message || "Error al actualizar cantidad", "error")
      loadCart() // Recargar para restablecer la vista
    }
  } catch (error) {
    console.log("[v0] Error updating cart quantity:", error)
    showToast("Error al actualizar cantidad", "error")
  }
}

function handleQuantityChange(cartItemId, value) {
  updateCartQuantity(cartItemId, value)
}

async function removeFromCart(id) {
  showConfirm("¿Estás seguro de eliminar este producto del carrito?", async () => {
    const formData = new FormData()
    formData.append("id", id)

    try {
      const response = await fetch("../controllers/carrito.php?action=remove", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        loadCart()
      } else {
        showToast(data.message || "Error al eliminar", "error")
      }
    } catch (error) {
      console.log("[v0] Error removing from cart:", error)
    }
  }, () => {
    // Usuario canceló la eliminación.
  })
}

async function clearCart(skipConfirm = false) {
  const doClear = async () => {
    try {
const response = await fetch("../controllers/carrito.php?action=clear", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        loadCart()
      } else {
        showToast(data.message || "No se pudo vaciar", "error")
      }
    } catch (error) {
      console.log("[v0] Error clearing cart:", error)
    }
  }

  if (skipConfirm) {
    await doClear()
    return
  }

  return new Promise((resolve) => {
    showConfirm("¿Estás seguro de vaciar el carrito?", async () => {
      await doClear()
      resolve()
    }, () => {
      // canceled
      resolve()
    })
  })
}


async function checkout() {
  if (!currentUser) {
    showToast("Debes iniciar sesión para comprar", "error")
    return
  }

  showConfirm("¿Estás seguro de finalizar la compra?", async () => {
    try {
      const response = await fetch("../controllers/carrito.php?action=checkout", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        showToast("¡Compra realizada con éxito!", "success")
        window.location.href = "historial.html"
      } else {
        showToast(data.message || "No se pudo completar la compra", "error")
      }
    } catch (error) {
      console.log("Error checking out:", error)
      showToast("Error al procesar la compra", "error")
    }
  })
}

document.addEventListener("DOMContentLoaded", () => {
  loadCart()
})
