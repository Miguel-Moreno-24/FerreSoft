async function checkAdminAccess() {
  try {
    const response = await fetch("../controllers/auth.php?action=check");
    const data = await response.json();
    if (!data.logged_in || String(data.user.rol).toLowerCase() !== "admin") {
      showToast("Acceso denegado", "error");
      window.location.href = "login.html";
    }
  } catch (error) {
    window.location.href = "login.html";
  }
}

// Navegación entre secciones
function showSection(sectionId) {
  document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
  
  document.getElementById(`section-${sectionId}`).classList.add("active");
  const activeItem = Array.from(document.querySelectorAll(".sidebar-item")).find(i => i.textContent.toLowerCase().includes(sectionId.toLowerCase()));
  if (activeItem) activeItem.classList.add("active");

  // Cargar datos según la sección
  if (sectionId === 'dashboard') loadStats();
  if (sectionId === 'productos') loadProducts();
  if (sectionId === 'pedidos') loadPedidos();
  if (sectionId === 'usuarios') loadUsuarios();
}

// Dashboard Stats
async function loadStats() {
  try {
    const response = await fetch("../controllers/admin_api.php?action=stats");
    const data = await response.json();
    if (data.success) {
      document.getElementById("stat-productos").textContent = data.stats.productos;
      document.getElementById("stat-usuarios").textContent = data.stats.usuarios;
      document.getElementById("stat-pedidos").textContent = data.stats.pedidos;
    }
  } catch (error) { console.error("Error stats:", error); }
}

// Gestión de Productos
let productosCache = [];
async function loadProducts() {
  const tbody = document.getElementById("productos-table");
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Cargando...</td></tr>';
  try {
    const response = await fetch("../controllers/productos.php?action=list");
    const productos = await response.json();
    productosCache = productos;
    renderProducts(productos);
  } catch (error) { console.error("Error products:", error); }
}

function renderProducts(list) {
  const tbody = document.getElementById("productos-table");
  tbody.innerHTML = "";
  list.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td><img src="${resolveImagePath(p.imagen)}" style="width:50px; height:50px; object-fit:cover;"></td>
      <td>${p.nombre}</td>
      <td>$${Number(p.precio).toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btn btn-success" style="padding:0.4rem; margin-right:0.2rem;" onclick="editProduct(${p.id})">Editar</button>
        <button class="btn btn-danger" style="padding:0.4rem;" onclick="deleteProduct(${p.id})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Gestión de Pedidos
async function loadPedidos() {
  const tbody = document.getElementById("pedidos-table");
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Cargando...</td></tr>';
  try {
    const response = await fetch("../controllers/admin_api.php?action=list_pedidos");
    const data = await response.json();
    if (data.success) {
      tbody.innerHTML = "";
      data.pedidos.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>#${p.id}</td>
          <td>${p.usuario_nombre}<br><small>${p.usuario_email}</small></td>
          <td>${p.resumen_productos}</td>
          <td>$${Number(p.total).toFixed(2)}</td>
          <td>
            <select onchange="updatePedidoEstado(${p.id}, this.value)" class="estado-select">
              <option value="Pendiente" ${p.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="Enviado" ${p.estado === 'Enviado' ? 'selected' : ''}>Enviado</option>
              <option value="Entregado" ${p.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
            </select>
          </td>
          <td>${new Date(p.fecha_pedido).toLocaleDateString()}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) { console.error("Error pedidos:", error); }
}

async function updatePedidoEstado(id, estado) {
  const formData = new FormData();
  formData.append("id", id);
  formData.append("estado", estado);
  try {
    const response = await fetch("../controllers/admin_api.php?action=update_pedido", {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    if (data.success) showToast(data.message);
  } catch (error) { showToast("Error al actualizar", "error"); }
}

// Gestión de Usuarios
async function loadUsuarios() {
  const tbody = document.getElementById("usuarios-table");
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Cargando...</td></tr>';
  try {
    const response = await fetch("../controllers/admin_api.php?action=list_usuarios");
    const data = await response.json();
    if (data.success) {
      tbody.innerHTML = "";
      data.usuarios.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${u.id}</td>
          <td>${u.nombre}</td>
          <td>${u.email}</td>
          <td>${u.rol}</td>
          <td>${new Date(u.fecha_registro).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-danger" style="padding:0.4rem;" onclick="deleteUsuario(${u.id})">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) { console.error("Error users:", error); }
}

async function deleteUsuario(id) {
  showConfirm("¿Seguro que deseas eliminar este usuario?", async () => {
    const formData = new FormData();
    formData.append("id", id);
    try {
      const response = await fetch("../controllers/admin_api.php?action=delete_usuario", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        showToast(data.message);
        loadUsuarios();
      } else {
        showToast(data.message, "error");
      }
    } catch (error) { showToast("Error al eliminar", "error"); }
  });
}

// Helpers CRUD Productos (manteniendo lógica previa adaptada)
function openModal(producto = null) {
  const modal = document.getElementById("producto-modal");
  const form = document.getElementById("producto-form");
  if (producto) {
    document.getElementById("modal-title").textContent = "Editar Producto";
    document.getElementById("producto-id").value = producto.id;
    document.getElementById("producto-nombre").value = producto.nombre;
    document.getElementById("producto-descripcion").value = producto.descripcion;
    document.getElementById("producto-precio").value = producto.precio;
    document.getElementById("producto-stock").value = producto.stock;
    document.getElementById("producto-imagen").value = producto.imagen;
  } else {
    document.getElementById("modal-title").textContent = "Agregar Producto";
    form.reset();
    document.getElementById("producto-id").value = "";
  }
  modal.classList.add("active");
}

function closeModal() {
  document.getElementById("producto-modal").classList.remove("active");
}

async function editProduct(id) {
  const p = productosCache.find(item => item.id == id);
  if (p) openModal(p);
}

async function deleteProduct(id) {
  showConfirm("¿Seguro que deseas eliminar este producto?", async () => {
    const formData = new FormData();
    formData.append("id", id);
    try {
      const response = await fetch("../controllers/productos.php?action=delete", { method: "POST", body: formData });
      const data = await response.json();
      if (data.success) { showToast("Eliminado"); loadProducts(); }
    } catch (error) { console.error("Error delete:", error); }
  });
}

document.getElementById("producto-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("producto-id").value;
  const formData = new FormData(e.target);
  if (id) formData.append("id", id);
  const action = id ? "update" : "add";
  try {
    const response = await fetch(`../controllers/productos.php?action=${action}`, { method: "POST", body: formData });
    const data = await response.json();
    if (data.success) { showToast(data.message); closeModal(); loadProducts(); }
    else { showToast(data.message, "error"); }
  } catch (error) { console.error("Error save:", error); }
});

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  checkAdminAccess();
  loadStats();
  
  const searchInput = document.getElementById("productos-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = productosCache.filter(p => p.nombre.toLowerCase().includes(q));
      renderProducts(filtered);
    });
  }
});
