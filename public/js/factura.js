function formatInvoiceDate(dateValue) {
  const language = getCurrentLanguage()
  return new Date(dateValue).toLocaleString(language === 'en' ? 'en-US' : 'es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadInvoice() {
  const params = new URLSearchParams(window.location.search)
  const invoiceId = parseInt(params.get('id') || '', 10)

  if (Number.isNaN(invoiceId) || invoiceId < 1) {
    showToast('No se encontró el pedido solicitado', 'error')
    return
  }

  try {
    const response = await fetch(`../controllers/pedidos.php?action=get&id=${invoiceId}`)
    const data = await response.json()

    if (!data.success) {
      showToast(data.message || 'No se pudo cargar la factura', 'error')
      return
    }

    const pedido = data.pedido
    document.getElementById('invoice-number').textContent = pedido.numero_pedido || `Pedido #${pedido.id}`
    document.getElementById('invoice-date').textContent = `Fecha de compra: ${formatInvoiceDate(pedido.fecha_pedido)}`
    document.getElementById('invoice-customer-name').textContent = pedido.nombre_cliente || pedido.usuario_actual || '-'
    document.getElementById('invoice-customer-email').textContent = pedido.correo_cliente || pedido.correo_actual || '-'
    document.getElementById('invoice-address').textContent = pedido.direccion_entrega || 'Sin dirección registrada'
    document.getElementById('invoice-city').textContent = pedido.ciudad_entrega || 'Sin ciudad registrada'
    document.getElementById('invoice-method').textContent = `Método: ${pedido.metodo_pago || 'Pago simulado'}`
    document.getElementById('invoice-reference').textContent = `Referencia: ${pedido.referencia_pago || 'No aplica'}`
    document.getElementById('invoice-subtotal').textContent = `$${Number(pedido.subtotal).toFixed(2)}`
    document.getElementById('invoice-total').textContent = `$${Number(pedido.total).toFixed(2)}`

    const itemsBody = document.getElementById('invoice-items')
    itemsBody.innerHTML = ''
    pedido.productos.forEach((producto) => {
      const row = document.createElement('tr')
      row.innerHTML = `
        <td>${producto.nombre}</td>
        <td>${producto.cantidad}</td>
        <td>$${Number(producto.precio_unitario).toFixed(2)}</td>
        <td>$${Number(producto.subtotal).toFixed(2)}</td>
      `
      itemsBody.appendChild(row)
    })
  } catch (error) {
    console.log('Error cargando la factura:', error)
    showToast('Error al cargar la factura', 'error')
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadInvoice()
})
