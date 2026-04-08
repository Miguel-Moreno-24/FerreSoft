// Cargar datos del usuario actual
async function loadUserData() {
  try {
    const response = await fetch("../controllers/usuario.php?action=get")
    const data = await response.json()

    if (data.success) {
      const user = data.user
      document.getElementById("nombre").value = user.nombre || ""
      document.getElementById("email").value = user.email || ""
      document.getElementById("telefono").value = user.telefono || ""
      document.getElementById("ciudad").value = user.ciudad || ""
      document.getElementById("direccion").value = user.direccion || ""
      document.getElementById("tipo_documento").value = user.tipo_documento || ""
      document.getElementById("numero_documento").value = user.numero_documento || ""
    } else {
      showToast(data.message || "Error cargando datos", "error")
      setTimeout(() => window.location.href = "login.html", 2000)
    }
  } catch (error) {
    console.log("[v0] Error loading user data:", error)
    showToast("Error al cargar datos", "error")
  }
}

// Manejar envío del formulario
document.getElementById("account-form").addEventListener("submit", async (e) => {
  e.preventDefault()

  const tipoDoc = document.getElementById("tipo_documento").value
  const numDoc = document.getElementById("numero_documento").value.trim()
  const messageDiv = document.getElementById("message")

  // Validaciones de dependencia de documentos
  if (tipoDoc !== "" && numDoc === "") {
    showToast("Debe ingresar el número de documento si seleccionó un tipo", "error")
    return
  }
  if (numDoc !== "" && tipoDoc === "") {
    showToast("Debe seleccionar un tipo de documento si ingresó un número", "error")
    return
  }

  const formData = new FormData()
  formData.append("nombre", document.getElementById("nombre").value)
  formData.append("email", document.getElementById("email").value)
  formData.append("telefono", document.getElementById("telefono").value)
  formData.append("ciudad", document.getElementById("ciudad").value)
  formData.append("direccion", document.getElementById("direccion").value)
  formData.append("tipo_documento", tipoDoc)
  formData.append("numero_documento", numDoc)

  try {
    const response = await fetch("../controllers/usuario.php?action=update", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      messageDiv.style.color = "#22c55e"
      messageDiv.textContent = data.message
      messageDiv.style.display = "block"
      
      // Actualizar currentUser y el nombre en el menú
      if (typeof currentUser !== "undefined" && currentUser) {
        currentUser.nombre = data.user.nombre
        currentUser.email = data.user.email
        
        const menuNameEl = document.getElementById("user-menu-name")
        if (menuNameEl) {
          menuNameEl.textContent = data.user.nombre
        }
      }

      setTimeout(() => {
        messageDiv.style.display = "none"
      }, 3000)
    } else {
      messageDiv.style.color = "#ef4444"
      messageDiv.textContent = data.message
      messageDiv.style.display = "block"
    }
  } catch (error) {
    console.log("[v0] Error updating user:", error)
    const messageDiv = document.getElementById("message")
    messageDiv.style.color = "#ef4444"
    messageDiv.textContent = "Error al guardar cambios"
    messageDiv.style.display = "block"
  }
})

document.addEventListener("DOMContentLoaded", () => {
  loadUserData()
})
