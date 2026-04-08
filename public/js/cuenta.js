function showAccountMessage(message, type = "error") {
  const messageDiv = document.getElementById("message")
  if (!messageDiv) return

  messageDiv.style.display = "block"
  messageDiv.style.background = type === "success" ? "#dcfce7" : "#fee2e2"
  messageDiv.style.color = type === "success" ? "#166534" : "#991b1b"
  messageDiv.style.border = `1px solid ${type === "success" ? "#86efac" : "#fca5a5"}`
  messageDiv.textContent = message
}

function validateAccountForm() {
  const nombre = document.getElementById("nombre").value.trim()
  const email = document.getElementById("email").value.trim()
  const tipoDocumento = document.getElementById("tipo_documento").value.trim()
  const numeroDocumento = document.getElementById("numero_documento").value.trim()
  const telefono = document.getElementById("telefono").value.trim()

  if (!nombre) return "Debes ingresar tu nombre"
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/u.test(nombre)) return "El nombre solo puede contener letras y espacios"

  if (!email) return "Debes ingresar un correo electronico"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Ingresa un correo valido"

  if ((tipoDocumento && !numeroDocumento) || (!tipoDocumento && numeroDocumento)) {
    return "Debes completar tipo y numero de documento juntos"
  }

  if (tipoDocumento && !/^[0-9A-Za-z-]{5,20}$/.test(numeroDocumento)) {
    return "El numero de documento debe tener entre 5 y 20 caracteres validos"
  }

  if (telefono && !/^\+?[0-9\s-]{7,20}$/.test(telefono)) {
    return "El telefono debe tener entre 7 y 20 caracteres numericos"
  }

  return null
}

async function loadUserData() {
  try {
    const response = await fetch("../controllers/usuario.php?action=get")
    const data = await response.json()

    if (!data.success) {
      showToast(data.message || "Error cargando datos", "error")
      setTimeout(() => {
        window.location.href = "login.html"
      }, 1500)
      return
    }

    const user = data.user
    document.getElementById("nombre").value = user.nombre || ""
    document.getElementById("email").value = user.email || ""
    document.getElementById("telefono").value = user.telefono || ""
    document.getElementById("ciudad").value = user.ciudad || ""
    document.getElementById("direccion").value = user.direccion || ""
    document.getElementById("tipo_documento").value = user.tipo_documento || ""
    document.getElementById("numero_documento").value = user.numero_documento || ""
  } catch (error) {
    console.log("[v0] Error loading user data:", error)
    showToast("Error al cargar datos", "error")
  }
}

document.getElementById("account-form")?.addEventListener("submit", async (e) => {
  e.preventDefault()

  const validationError = validateAccountForm()
  if (validationError) {
    showAccountMessage(validationError, "error")
    return
  }

  showConfirm("¿Guardar cambios en tu cuenta?", async () => {
    const formData = new FormData()
    formData.append("nombre", document.getElementById("nombre").value.trim())
    formData.append("email", document.getElementById("email").value.trim())
    formData.append("telefono", document.getElementById("telefono").value.trim())
    formData.append("ciudad", document.getElementById("ciudad").value.trim())
    formData.append("direccion", document.getElementById("direccion").value.trim())
    formData.append("tipo_documento", document.getElementById("tipo_documento").value.trim())
    formData.append("numero_documento", document.getElementById("numero_documento").value.trim())

    try {
      const response = await fetch("../controllers/usuario.php?action=update", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        showAccountMessage(data.message || "No se pudieron guardar los cambios", "error")
        return
      }

      if (typeof currentUser !== "undefined" && currentUser) {
        currentUser.nombre = data.user.nombre
        currentUser.email = data.user.email
      }

      const menuNameEl = document.getElementById("user-menu-name")
      if (menuNameEl) {
        menuNameEl.textContent = data.user.nombre
      }

      showAccountMessage(data.message, "success")
    } catch (error) {
      console.log("[v0] Error updating user:", error)
      showAccountMessage("Error al guardar cambios", "error")
    }
  })
})

document.addEventListener("DOMContentLoaded", () => {
  loadUserData()
})
