let isLogin = true
const MAX_NAME_LENGTH = 60

function updateAuthMode() {
  const nombreGroup = document.getElementById("nombre-group")
  const formTitle = document.getElementById("form-title")
  const submitBtn = document.getElementById("submit-btn")
  const toggleText = document.getElementById("toggle-text")
  const toggleLink = document.getElementById("toggle-link")
  const message = document.getElementById("message")

  if (isLogin) {
    nombreGroup.style.display = "none"
    formTitle.textContent = "Iniciar Sesion"
    submitBtn.textContent = "Iniciar Sesion"
    toggleText.textContent = "No tienes cuenta?"
    toggleLink.textContent = "Registrate"
  } else {
    nombreGroup.style.display = "block"
    formTitle.textContent = "Registrarse"
    submitBtn.textContent = "Registrarse"
    toggleText.textContent = "Ya tienes cuenta?"
    toggleLink.textContent = "Iniciar Sesion"
  }

  message.textContent = ""
}

document.getElementById("toggle-link").addEventListener("click", (e) => {
  e.preventDefault()
  isLogin = !isLogin
  updateAuthMode()
})

document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault()

  const messageDiv = document.getElementById("message")
  messageDiv.textContent = ""
  messageDiv.style.color = "#ef4444"

  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value
  const formData = new FormData()
  formData.append("email", email)
  formData.append("password", password)

  if (!isLogin) {
    const nombre = document.getElementById("nombre").value.trim()

    if (!nombre) {
      messageDiv.textContent = "Debes ingresar tu nombre"
      return
    }

    if (nombre.length > MAX_NAME_LENGTH) {
      messageDiv.textContent = "El nombre no puede superar los 60 caracteres"
      return
    }

    formData.append("nombre", nombre)
  }

  const action = isLogin ? "login" : "register"

  try {
    const response = await fetch(`api/auth.php?action=${action}`, {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      messageDiv.style.color = "#22c55e"
      messageDiv.textContent = data.message

      if (isLogin) {
        setTimeout(() => {
          if (data.user.rol === "admin") {
            window.location.href = "admin.html"
          } else {
            window.location.href = "index.html"
          }
        }, 1000)
      } else {
        setTimeout(() => {
          isLogin = true
          updateAuthMode()
        }, 1500)
      }
    } else {
      messageDiv.style.color = "#ef4444"
      messageDiv.textContent = data.message
    }
  } catch (error) {
    console.log("[v0] Error:", error)
    messageDiv.textContent = "Error de conexion"
  }
})

updateAuthMode()