async function loadThemePreference() {
  try {
    const response = await fetch("../controllers/usuario.php?action=get")
    const data = await response.json()
    if (!data.success) return "light"
    return data.user.theme_preference || "light"
  } catch (error) {
    console.log("[v0] Error loading theme preference:", error)
    return "light"
  }
}

async function setThemePreference(theme) {
  const formData = new FormData()
  formData.append("theme", theme)

  const response = await fetch("../controllers/usuario.php?action=theme", {
    method: "POST",
    body: formData,
  })

  return response.json()
}

async function setupThemeSwitcher() {
  const themeRadios = document.getElementsByName("theme")
  const savedTheme = await loadThemePreference()

  themeRadios.forEach((radio) => {
    radio.checked = radio.value === savedTheme
    radio.addEventListener("change", async (e) => {
      const selectedTheme = e.target.value
      applyTheme(selectedTheme)

      try {
        const result = await setThemePreference(selectedTheme)
        if (!result.success) {
          showToast(result.message || "No se pudo guardar el tema", "error")
          applyTheme("light")
          const fallback = document.querySelector('input[name="theme"][value="light"]')
          if (fallback) fallback.checked = true
          return
        }

        if (currentUser) {
          currentUser.theme_preference = selectedTheme
        }

        showToast("Tema actualizado", "success")
      } catch (error) {
        console.log("[v0] Error saving theme:", error)
        showToast("Error al guardar el tema", "error")
      }
    })
  })

  applyTheme(savedTheme)
}

async function handlePasswordChange(e) {
  e.preventDefault()

  const newPass = document.getElementById("new_password").value
  const confirmPass = document.getElementById("confirm_password").value
  const messageDiv = document.getElementById("password-message")

  if (newPass !== confirmPass) {
    showToast("Las contrasenas no coinciden", "error")
    return
  }

  const formData = new FormData()
  formData.append("password", newPass)

  try {
    const userResp = await fetch("../controllers/usuario.php?action=get")
    const userData = await userResp.json()

    if (!userData.success) {
      showToast("Error al obtener datos del usuario", "error")
      return
    }

    formData.append("nombre", userData.user.nombre || "")
    formData.append("email", userData.user.email || "")
    formData.append("telefono", userData.user.telefono || "")
    formData.append("ciudad", userData.user.ciudad || "")
    formData.append("direccion", userData.user.direccion || "")
    formData.append("tipo_documento", userData.user.tipo_documento || "")
    formData.append("numero_documento", userData.user.numero_documento || "")

    const response = await fetch("../controllers/usuario.php?action=update", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    messageDiv.style.display = "block"
    if (data.success) {
      messageDiv.style.color = "#166534"
      messageDiv.style.background = "#dcfce7"
      messageDiv.style.border = "1px solid #86efac"
      messageDiv.textContent = "Contrasena actualizada correctamente"
      document.getElementById("password-form").reset()
    } else {
      messageDiv.style.color = "#991b1b"
      messageDiv.style.background = "#fee2e2"
      messageDiv.style.border = "1px solid #fca5a5"
      messageDiv.textContent = data.message
    }
  } catch (error) {
    console.error("Error updating password:", error)
    showToast("Error al procesar la solicitud", "error")
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupThemeSwitcher()

  const passForm = document.getElementById("password-form")
  if (passForm) {
    passForm.addEventListener("submit", handlePasswordChange)
  }
})
