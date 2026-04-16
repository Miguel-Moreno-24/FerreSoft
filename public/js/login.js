let isLogin = true

const textosLogin = {
  es: {
    loginTitle: 'Iniciar Sesión',
    registerTitle: 'Registrarse',
    loginSubmit: 'Iniciar Sesión',
    registerSubmit: 'Registrarse',
    noAccount: '\u00bfNo tienes cuenta?',
    haveAccount: '\u00bfYa tienes cuenta?',
    goRegister: 'Reg\u00edstrate',
    goLogin: 'Iniciar Sesi\u00f3n',
    namePlaceholder: 'Nombre completo',
    emailPlaceholder: 'Correo electr\u00f3nico',
    passwordPlaceholder: 'Contrase\u00f1a',
    requiredBoth: 'Debes ingresar correo y contrase\u00f1a',
    requiredEmail: 'Debes ingresar un correo electr\u00f3nico',
    invalidEmail: 'Ingresa un correo v\u00e1lido',
    requiredPassword: 'Debes ingresar una contrase\u00f1a',
    requiredName: 'Debes ingresar tu nombre',
    invalidName: 'El nombre solo puede contener letras y espacios',
    maxName: 'El nombre no puede superar los 60 caracteres',
    emailExists: 'El correo ya est\u00e1 registrado',
    invalidPassword: 'La contrase\u00f1a debe tener al menos 8 caracteres e incluir una may\u00fascula, un n\u00famero y un car\u00e1cter especial',
    connectionError: 'Error de conexi\u00f3n',
  },
  en: {
    loginTitle: 'Log In',
    registerTitle: 'Sign Up',
    loginSubmit: 'Log In',
    registerSubmit: 'Sign Up',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    goRegister: 'Sign Up',
    goLogin: 'Log In',
    namePlaceholder: 'Full name',
    emailPlaceholder: 'Email address',
    passwordPlaceholder: 'Password',
    requiredBoth: 'You must enter an email and password',
    requiredEmail: 'You must enter an email address',
    invalidEmail: 'Enter a valid email address',
    requiredPassword: 'You must enter a password',
    requiredName: 'You must enter your name',
    invalidName: 'The name can only contain letters and spaces',
    maxName: 'The name cannot be longer than 60 characters',
    emailExists: 'The email is already registered',
    invalidPassword: 'The password must be at least 8 characters long and include an uppercase letter, a number, and a special character',
    connectionError: 'Connection error',
  },
}

function textoLogin(key) {
  const language = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'es'
  return textosLogin[language]?.[key] || textosLogin.es[key]
}

function applyLoginTexts() {
  const nombreInput = document.getElementById('nombre')
  const emailInput = document.getElementById('email')
  const passwordInput = document.getElementById('password')
  const toggleText = document.getElementById('toggle-text')
  const toggleLink = document.getElementById('toggle-link')
  const formTitle = document.getElementById('form-title')
  const submitBtn = document.getElementById('submit-btn')

  if (nombreInput) nombreInput.placeholder = textoLogin('namePlaceholder')
  if (emailInput) emailInput.placeholder = textoLogin('emailPlaceholder')
  if (passwordInput) passwordInput.placeholder = textoLogin('passwordPlaceholder')

  if (isLogin) {
    if (formTitle) formTitle.textContent = textoLogin('loginTitle')
    if (submitBtn) submitBtn.textContent = textoLogin('loginSubmit')
    if (toggleText) toggleText.textContent = textoLogin('noAccount')
    if (toggleLink) toggleLink.textContent = textoLogin('goRegister')
  } else {
    if (formTitle) formTitle.textContent = textoLogin('registerTitle')
    if (submitBtn) submitBtn.textContent = textoLogin('registerSubmit')
    if (toggleText) toggleText.textContent = textoLogin('haveAccount')
    if (toggleLink) toggleLink.textContent = textoLogin('goLogin')
  }
}

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
  if (isLogin) {
    if (nombreGroup) nombreGroup.style.display = 'none'
  } else {
    if (nombreGroup) nombreGroup.style.display = 'block'
  }

  applyLoginTexts()

  const msg = document.getElementById('message')
  if (msg) msg.textContent = ''
}

document.getElementById('toggle-link')?.addEventListener('click', (event) => {
  event.preventDefault()
  toggleMode(!isLogin)
})

document.addEventListener('DOMContentLoaded', () => {
  applyLoginTexts()
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('mode') === 'register') {
    toggleMode(false)
  }
})

document.addEventListener('idioma-cambiado', () => {
  applyLoginTexts()
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
    messageDiv.textContent = textoLogin('requiredBoth')
    return
  }

  if (!email) {
    messageDiv.textContent = textoLogin('requiredEmail')
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    messageDiv.textContent = textoLogin('invalidEmail')
    return
  }

  if (!password) {
    messageDiv.textContent = textoLogin('requiredPassword')
    return
  }

  formData.append('email', email)
  formData.append('password', password)

  if (!isLogin) {
    const nombre = document.getElementById('nombre').value.trim()

    if (!nombre) {
      messageDiv.textContent = textoLogin('requiredName')
      return
    }

    if (nombre.length > 60) {
      messageDiv.textContent = textoLogin('maxName')
      return
    }

    if (!/^[\p{L}\s'-]+$/u.test(nombre)) {
      messageDiv.textContent = textoLogin('invalidName')
      return
    }

    if (await checkEmailExists(email)) {
      messageDiv.textContent = textoLogin('emailExists')
      return
    }

    const tieneMayuscula = /[A-Z]/.test(password)
    const tieneNumero = /\d/.test(password)
    const tieneEspecial = /[^A-Za-z0-9]/.test(password)
    const tieneAlMenos8 = password.length >= 8

    if (!(tieneMayuscula && tieneNumero && tieneEspecial && tieneAlMenos8)) {
      messageDiv.textContent = textoLogin('invalidPassword')
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
    messageDiv.textContent = textoLogin('connectionError')
  }
})

const pwInput = document.getElementById('password')
const showPw = document.getElementById('show-password-checkbox')
if (showPw && pwInput) {
  showPw.addEventListener('change', () => {
    pwInput.type = showPw.checked ? 'text' : 'password'
  })
}
