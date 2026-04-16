function formatearFecha(fecha) {
  const language = getCurrentLanguage()
  return new Date(fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function loadHistorial() {
  const container = document.getElementById('historial-container')
  if (!container) return

  try {
    const response = await fetch('../controllers/pedidos.php?action=list')
    const data = await response.json()

    if (!data.success) {
      showToast(data.message || 'Error al cargar el historial', 'error')
      container.innerHTML = `<p class="error">${data.message || 'No se pudo cargar el historial'}</p>`
      return
    }

    if (data.pedidos.length === 0) {
      container.innerHTML = `
        <div class="no-pedidos">
          <p>No has realizado ninguna compra todavía.</p>
          <a href="index.html" class="btn btn-success" style="margin-top: 1rem;">Ir a comprar</a>
        </div>
      `
      return
    }

    container.innerHTML = ''
    data.pedidos.forEach((pedido) => {
      const pedidoCard = document.createElement('div')
      pedidoCard.className = 'pedido-card'

      const estadoClase = `estado-${String(pedido.estado).toLowerCase()}`
      let productosHTML = ''
      pedido.productos.forEach((producto) => {
        const destino = Number(producto.producto_id) > 0 ? `index.html?producto=${producto.producto_id}` : 'index.html'
        productosHTML += `
          <div class="producto-item">
            <img src="${resolveImagePath(producto.imagen)}" alt="${producto.nombre}">
            <div class="producto-info">
              <span class="producto-nombre">${producto.nombre}</span>
              <span class="producto-detalle">Cantidad: ${producto.cantidad} x $${Number(producto.precio_unitario).toFixed(2)}</span>
            </div>
            <div class="historial-item-actions">
              <a href="${destino}" class="btn">Ver en la tienda</a>
              <a href="factura.html?id=${pedido.id}" class="btn btn-success">Ver factura</a>
            </div>
          </div>
        `
      })

      pedidoCard.innerHTML = `
        <div class="pedido-header">
          <div class="pedido-info">
            <h3>${pedido.numero_pedido || `Pedido #${pedido.id}`}</h3>
            <span class="pedido-fecha">Realizado el ${formatearFecha(pedido.fecha_pedido)}</span>
          </div>
          <span class="pedido-estado ${estadoClase}">${pedido.estado}</span>
        </div>
        <div class="productos-lista">
          ${productosHTML}
        </div>
        <div class="pedido-total">
          Total: $${Number(pedido.total).toFixed(2)}
        </div>
      `

      container.appendChild(pedidoCard)
    })
  } catch (error) {
    console.error('Error cargando el historial:', error)
    container.innerHTML = '<p class="error">Error al conectar con el servidor</p>'
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadHistorial()
})
