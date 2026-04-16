function showPaymentMessage(message, type = 'error') {
  const messageBox = document.getElementById('payment-message')
  if (!messageBox) return

  messageBox.style.display = 'block'
  messageBox.className = `form-message ${type}`
  messageBox.textContent = message
}

function validatePaymentForm() {
  const direccion = document.getElementById('direccion_entrega').value.trim()
  const ciudad = document.getElementById('ciudad_entrega').value.trim()
  const metodo = document.getElementById('metodo_pago').value
  const referencia = document.getElementById('referencia_pago').value.trim()

  if (direccion.length < 5) {
    return 'La dirección de entrega debe tener al menos 5 caracteres'
  }

  if (!/^[\p{L}0-9\s.,#-]{2,120}$/u.test(ciudad)) {
    return 'La ciudad de entrega no es válida'
  }

  if (!metodo) {
    return 'Debes seleccionar un método de pago'
  }

  if (metodo !== 'contraentrega' && referencia.length < 4) {
    return 'Ingresa una referencia de pago válida'
  }

  return null
}

async function loadCheckoutSummary() {
  try {
    const response = await fetch('../controllers/carrito.php?action=summary')
    const data = await response.json()

    if (!data.success) {
      showToast(data.message || 'No se pudo cargar el resumen del carrito', 'error')
      window.location.href = 'carrito.html'
      return
    }

    document.getElementById('nombre_cliente').value = data.user?.nombre || ''
    document.getElementById('correo_cliente').value = data.user?.email || ''
    document.getElementById('telefono_cliente').value = data.user?.telefono || ''
    document.getElementById('ciudad_entrega').value = data.user?.ciudad || ''
    document.getElementById('direccion_entrega').value = data.user?.direccion || ''
    document.getElementById('checkout-total').textContent = Number(data.total).toFixed(2)

    const itemsContainer = document.getElementById('checkout-items')
    itemsContainer.innerHTML = ''
    data.items.forEach((item) => {
      const row = document.createElement('article')
      row.className = 'checkout-item'
      row.innerHTML = `
        <img src="${resolveImagePath(item.imagen)}" alt="${item.nombre}">
        <div>
          <h3>${item.nombre}</h3>
          <p>Cantidad: ${item.cantidad}</p>
          <span>$${Number(item.subtotal).toFixed(2)}</span>
        </div>
      `
      itemsContainer.appendChild(row)
    })
  } catch (error) {
    console.log('Error cargando el resumen del pago:', error)
    showToast('No se pudo cargar el proceso de pago', 'error')
  }
}

document.getElementById('payment-form')?.addEventListener('submit', async (event) => {
  event.preventDefault()

  const validationError = validatePaymentForm()
  if (validationError) {
    showPaymentMessage(validationError, 'error')
    return
  }

  const formData = new FormData(event.target)

  try {
    const response = await fetch('../controllers/carrito.php?action=checkout', {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()

    if (!data.success) {
      showPaymentMessage(data.message || 'No se pudo procesar el pago', 'error')
      return
    }

    showPaymentMessage(data.message, 'success')
    loadCartCount()
    setTimeout(() => {
      window.location.href = `factura.html?id=${data.pedido_id}`
    }, 700)
  } catch (error) {
    console.log('Error procesando el pago:', error)
    showPaymentMessage('Error al procesar el pago', 'error')
  }
})

document.addEventListener('DOMContentLoaded', () => {
  loadCheckoutSummary()
})
