async function loadHistorial() {
  const container = document.getElementById("historial-container");
  
  try {
    const response = await fetch("../controllers/pedidos.php?action=list");
    const data = await response.json();

    if (!data.success) {
      showToast(data.message || "Error al cargar historial", "error");
      container.innerHTML = `<p class="error">${data.message || "No se pudo cargar el historial"}</p>`;
      return;
    }

    if (data.pedidos.length === 0) {
      container.innerHTML = `
        <div class="no-pedidos">
          <p>No has realizado ninguna compra todavía.</p>
          <a href="index.html" class="btn btn-success" style="margin-top: 1rem;">Ir a comprar</a>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    data.pedidos.forEach(pedido => {
      const pedidoCard = document.createElement("div");
      pedidoCard.className = "pedido-card";
      
      const estadoClase = `estado-${pedido.estado.toLowerCase()}`;
      
      let productosHTML = "";
      pedido.productos.forEach(prod => {
        productosHTML += `
          <div class="producto-item">
            <img src="${resolveImagePath(prod.imagen)}" alt="${prod.nombre}">
            <div class="producto-info">
              <span class="producto-nombre">${prod.nombre}</span>
              <span class="producto-detalle">Cantidad: ${prod.cantidad} x $${Number(prod.precio_unitario).toFixed(2)}</span>
            </div>
            <a href="producto.html?id=${prod.producto_id}" class="btn">Ver en la tienda</a>
          </div>
        `;
      });

      pedidoCard.innerHTML = `
        <div class="pedido-header">
          <div class="pedido-info">
            <h3>Pedido #${pedido.id}</h3>
            <span class="pedido-fecha">Realizado el: ${new Date(pedido.fecha_pedido).toLocaleDateString()}</span>
          </div>
          <span class="pedido-estado ${estadoClase}">${pedido.estado}</span>
        </div>
        <div class="productos-lista">
          ${productosHTML}
        </div>
        <div class="pedido-total">
          Total: $${Number(pedido.total).toFixed(2)}
        </div>
      `;
      
      container.appendChild(pedidoCard);
    });

  } catch (error) {
    console.error("Error loading history:", error);
    container.innerHTML = `<p class="error">Error al conectar con el servidor</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHistorial();
});
