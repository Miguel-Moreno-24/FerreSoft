function textosFactura() {
  return getCurrentLanguage() === 'en'
    ? {
        date: 'Purchase date',
        method: 'Method',
        reference: 'Reference',
        notApplicable: 'Not applicable',
        noAddress: 'No address registered',
        noCity: 'No city registered',
        simulated: 'Simulated payment',
        notFound: 'The requested order was not found',
        loadError: 'Could not load the invoice',
        connectionError: 'Error loading the invoice',
      }
    : {
        date: 'Fecha de compra',
        method: 'Método',
        reference: 'Referencia',
        notApplicable: 'No aplica',
        noAddress: 'Sin dirección registrada',
        noCity: 'Sin ciudad registrada',
        simulated: 'Pago simulado',
        notFound: 'No se encontró el pedido solicitado',
        loadError: 'No se pudo cargar la factura',
        connectionError: 'Error al cargar la factura',
      }
}

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
  const textos = textosFactura()
  const params = new URLSearchParams(window.location.search)
  const invoiceId = parseInt(params.get('id') || '', 10)

  if (Number.isNaN(invoiceId) || invoiceId < 1) {
    showToast(textos.notFound, 'error')
    return
  }

  try {
    const response = await fetch(`../controllers/pedidos.php?action=get&id=${invoiceId}`)
    const data = await response.json()

    if (!data.success) {
      showToast(data.message || textos.loadError, 'error')
      return
    }

    const pedido = data.pedido
    document.getElementById('invoice-number').textContent = pedido.numero_pedido || `Pedido #${pedido.id}`
    document.getElementById('invoice-date').textContent = `${textos.date}: ${formatInvoiceDate(pedido.fecha_pedido)}`
    document.getElementById('invoice-customer-name').textContent = pedido.nombre_cliente || pedido.usuario_actual || '-'
    document.getElementById('invoice-customer-email').textContent = pedido.correo_cliente || pedido.correo_actual || '-'
    document.getElementById('invoice-address').textContent = pedido.direccion_entrega || textos.noAddress
    document.getElementById('invoice-city').textContent = pedido.ciudad_entrega || textos.noCity
    document.getElementById('invoice-method').textContent = `${textos.method}: ${pedido.metodo_pago || textos.simulated}`
    document.getElementById('invoice-reference').textContent = `${textos.reference}: ${pedido.referencia_pago || textos.notApplicable}`
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
    showToast(textos.connectionError, 'error')
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadInvoice()
})

document.addEventListener('idioma-cambiado', () => {
  loadInvoice()
})
