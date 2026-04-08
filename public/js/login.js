let isLogin = true

async function checkEmailExists(email) {
  try {
    const response = await fetch(`../controllers/auth.php?action=email_exists&email=${encodeURIComponent(email)}`)
    const data = await response.json()
    return data.success && data.exists
  } catch (error) {
    console.log("[v0] Error checking email:", error)
    return false
  }
}

function toggleMode(toLogin) {
  isLogin = toLogin

  const nombreGroup = document.getElementById("nombre-group")
  const formTitle = document.getElementById("form-title")
  const submitBtn = document.getElementById("submit-btn")
  const toggleText = document.getElementById("toggle-text")
  const toggleLink = document.getElementById("toggle-link")

  if (isLogin) {
    if (nombreGroup) nombreGroup.style.display = "none"
    if (formTitle) formTitle.textContent = "Iniciar SesiÃ³n"
    if (submitBtn) submitBtn.textContent = "Iniciar SesiÃ³n"
    if (toggleText) toggleText.textContent = "Â¿No tienes cuenta?"
    if (toggleLink) toggleLink.textContent = "RegÃ­strate"
  } else {
    if (nombreGroup) nombreGroup.style.display = "block"
    if (formTitle) formTitle.textContent = "Registrarse"
    if (submitBtn) submitBtn.textContent = "Registrarse"
    if (toggleText) toggleText.textContent = "Â¿Ya tienes cuenta?"
    if (toggleLink) toggleLink.textContent = "Iniciar SesiÃ³n"
  }

  const msg = document.getElementById("message")
  if (msg) msg.textContent = ""
}

document.getElementById("toggle-link").addEventListener("click", (e) => {
  e.preventDefault()
  toggleMode(!isLogin)
})

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get("mode") === "register") {
    toggleMode(false)
  }
})

document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault()

  const messageDiv = document.getElementById("message")
  messageDiv.textContent = ""
  messageDiv.style.color = "#ef4444"

  const formData = new FormData()
  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value

  if (!email && !password) {
    messageDiv.textContent = "Debes ingresar correo y contraseÃ±a"
    return
  }

  if (!email) {
    messageDiv.textContent = "Debes ingresar un correo electrÃ³nico"
    return
  }

  // Validar formato bÃ¡sico de correo
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailValido) {
    messageDiv.textContent = "Ingresa un correo vÃ¡lido"
    return
  }

  if (!password) {
    messageDiv.textContent = "Debes ingresar una contraseÃ±a"
    return
  }

  formData.append("email", email)
  formData.append("password", password)

  if (!isLogin) {
    const nombre = document.getElementById("nombre").value.trim()

    if (!nombre) {
      messageDiv.style.color = "#ef4444"
      messageDiv.textContent = "Debes ingresar tu nombre"
      return
    }

    const nombreValido = /^[\\p{L}\\s'-]+$/u.test(nombre)
    if (!nombreValido) {
      messageDiv.style.color = "#ef4444"
      messageDiv.textContent = "El nombre solo puede contener letras y espacios"
      return
    }

    if (await checkEmailExists(email)) {
      messageDiv.style.color = "#ef4444"
      messageDiv.textContent = "El correo ya esta registrado"
      return
    }

    const tieneMayuscula = /[A-Z]/.test(password)
    const tieneNumero = /\d/.test(password)
    const tieneEspecial = /[^A-Za-z0-9]/.test(password)
    const tieneAlMenos8 = password.length >= 8

    if (!(tieneMayuscula && tieneNumero && tieneEspecial && tieneAlMenos8)) {
      messageDiv.style.color = "#ef4444"
      messageDiv.textContent =
        "La contraseÃ±a debe tener al menos 8 caracteres e incluir una mayÃºscula, un nÃºmero y un carÃ¡cter especial"
      return
    }

    formData.append("nombre", nombre)
  }

  const action = isLogin ? "login" : "register"

  try {
    const response = await fetch(`../controllers/auth.php?action=${action}`, {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      messageDiv.style.color = "#22c55e"
      messageDiv.textContent = data.message

      if (isLogin) {
        setTimeout(() => {
          const rolLower = String(data.user.rol).toLowerCase()
          if (rolLower.startsWith("admin")) {
            window.location.href = "admin.html"
          } else {
            window.location.href = "index.html"
          }
        }, 1000)
      } else {
        // Ya se iniciÃ³ sesiÃ³n en el backend tras registrar el usuario
        setTimeout(() => {
          window.location.href = "index.html"
        }, 1000)
      }
    } else {
      messageDiv.style.color = "#ef4444"
      messageDiv.textContent = data.message
    }
  } catch (error) {
    console.log("[v0] Error:", error)
    document.getElementById("message").textContent = "Error de conexiÃ³n"
  }
})

// Alternar visibilidad de la contrasena
const pwInput = document.getElementById("password")
const showPw = document.getElementById("show-password-checkbox")
if (showPw && pwInput) {
  showPw.addEventListener("change", () => {
    pwInput.type = showPw.checked ? "text" : "password"
  })
}
