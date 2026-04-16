let isLogin = true

async function checkEmailExists(email) {
  try {
    const response = await fetch(`../controllers/auth.php?action=email_exists&email=${encodeURIComponent(email)}`)
    const data = await response.json()
    return data.success && data.exists
  } catch (error) {
    console.log('Error verificando el correo:', error)
    return false
  }
}

function toggleMode(toLogin) {
  isLogin = toLogin

  const nombreGroup = document.getElementById('nombre-group')
  const formTitle = document.getElementById('form-title')
  const submitBtn = document.getElementById('submit-btn')
  const toggleText = document.getElementById('toggle-text')
  const toggleLink = document.getElementById('toggle-link')

  if (isLogin) {
    if (nombreGroup) nombreGroup.style.display = 'none'
    if (formTitle) formTitle.textContent = 'Iniciar Sesión'
    if (submitBtn) submitBtn.textContent = 'Iniciar Sesión'
    if (toggleText) toggleText.textContent = '¿No tienes cuenta?'
    if (toggleLink) toggleLink.textContent = 'Regístrate'
  } else {
    if (nombreGroup) nombreGroup.style.display = 'block'
    if (formTitle) formTitle.textContent = 'Registrarse'
    if (submitBtn) submitBtn.textContent = 'Registrarse'
    if (toggleText) toggleText.textContent = '¿Ya tienes cuenta?'
    if (toggleLink) toggleLink.textContent = 'Iniciar Sesión'
  }

  const msg = document.getElementById('message')
  if (msg) msg.textContent = ''
}

document.getElementById('toggle-link')?.addEventListener('click', (event) => {
  event.preventDefault()
  toggleMode(!isLogin)
})

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('mode') === 'register') {
    toggleMode(false)
  }
})

document.getElementById('auth-form')?.addEventListener('submit', async (event) => {
  event.preventDefault()

  const messageDiv = document.getElementById('message')
  messageDiv.textContent = ''
  messageDiv.style.color = '#ef4444'

  const formData = new FormData()
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  if (!email && !password) {
    messageDiv.textContent = 'Debes ingresar correo y contraseña'
    return
  }

  if (!email) {
    messageDiv.textContent = 'Debes ingresar un correo electrónico'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    messageDiv.textContent = 'Ingresa un correo válido'
    return
  }

  if (!password) {
    messageDiv.textContent = 'Debes ingresar una contraseña'
    return
  }

  formData.append('email', email)
  formData.append('password', password)

  if (!isLogin) {
    const nombre = document.getElementById('nombre').value.trim()

    if (!nombre) {
      messageDiv.textContent = 'Debes ingresar tu nombre'
      return
    }

    if (nombre.length > 60) {
      messageDiv.textContent = 'El nombre no puede superar los 60 caracteres'
      return
    }

    if (!/^[\p{L}\s'-]+$/u.test(nombre)) {
      messageDiv.textContent = 'El nombre solo puede contener letras y espacios'
      return
    }

    if (await checkEmailExists(email)) {
      messageDiv.textContent = 'El correo ya está registrado'
      return
    }

    const tieneMayuscula = /[A-Z]/.test(password)
    const tieneNumero = /\d/.test(password)
    const tieneEspecial = /[^A-Za-z0-9]/.test(password)
    const tieneAlMenos8 = password.length >= 8

    if (!(tieneMayuscula && tieneNumero && tieneEspecial && tieneAlMenos8)) {
      messageDiv.textContent = 'La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, un número y un carácter especial'
      return
    }

    formData.append('nombre', nombre)
  }

  const action = isLogin ? 'login' : 'register'

  try {
    const response = await fetch(`../controllers/auth.php?action=${action}`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      messageDiv.style.color = '#22c55e'
      messageDiv.textContent = data.message

      setTimeout(() => {
        const rolLower = String(data.user.rol).toLowerCase()
        if (rolLower.startsWith('admin')) {
          window.location.href = 'admin.html'
        } else {
          window.location.href = 'index.html'
        }
      }, 900)
    } else {
      messageDiv.style.color = '#ef4444'
      messageDiv.textContent = data.message
    }
  } catch (error) {
    console.log('Error en autenticación:', error)
    messageDiv.textContent = 'Error de conexión'
  }
})

const pwInput = document.getElementById('password')
const showPw = document.getElementById('show-password-checkbox')
if (showPw && pwInput) {
  showPw.addEventListener('change', () => {
    pwInput.type = showPw.checked ? 'text' : 'password'
  })
}
