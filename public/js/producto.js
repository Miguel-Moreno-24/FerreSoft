function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search)
  return params.get(name)
}

function resolveImagePath(path) {
  if (!path) return ""
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path
  const normalized = path.replace(/^\/+/, "")
  return "../" + normalized
}

async function loadProductDetail() {
  const id = getQueryParam("id")
  const container = document.getElementById("product-detail")

  if (!id) {
    container.innerHTML = '<p class="error">Producto no especificado</p>'
    return
  }

  try {
    const response = await fetch(`../controllers/productos.php?action=get&id=${encodeURIComponent(id)}`)
    const data = await response.json()

    if (!data.success) {
      container.innerHTML = `<p class="error">${data.message || "Producto no encontrado"}</p>`
      return
    }

    const p = data.product
    container.innerHTML = `
      <div class="product-image-container">
        <div class="product-image-wrapper">
          <img id="product-img" src="${resolveImagePath(p.imagen)}" alt="${p.nombre}">
        </div>
      </div>
      <div>
        <h2>${p.nombre}</h2>
        <p class="precio">$${Number.parseFloat(p.precio).toFixed(2)}</p>
        <p style="color:#7f8c8d; margin: .5rem 0 1rem;">ID: ${p.id}</p>
        <p>${p.descripcion || ""}</p>
        <p class="stock">Stock: ${p.stock} unidades</p>
        <div class="product-actions">
          <input id="qty" class="qty-input" type="number" min="1" value="1" ${p.stock > 0 ? `max="${p.stock}"` : "disabled"}>
          <button id="add-btn" class="btn btn-success" ${p.stock > 0 ? "" : "disabled"}>Agregar al Carrito</button>
        </div>
      </div>
    `

    document.getElementById("add-btn").addEventListener("click", () => {
      const qtyEl = document.getElementById("qty")
      const cantidad = parseInt(qtyEl.value, 10)
      addToCart(p.id, p.stock, cantidad)
    })
  } catch (error) {
    console.log("[v0] Error loading product detail:", error)
    container.innerHTML = '<p class="error">Error al cargar el producto</p>'
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProductDetail()
})

