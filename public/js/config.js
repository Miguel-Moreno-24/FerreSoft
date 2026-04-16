async function loadUserPreferences() {
  try {
    const response = await fetch('../controllers/usuario.php?action=get')
    const data = await response.json()
    if (!data.success) return null
    return data.user
  } catch (error) {
    console.log('Error cargando preferencias del usuario:', error)
    return null
  }
}

async function saveThemePreference(theme) {
  const formData = new FormData()
  formData.append('theme', theme)

  const response = await fetch('../controllers/usuario.php?action=theme', {
    method: 'POST',
    body: formData,
  })

  return response.json()
}

async function saveLanguagePreference(language) {
  const formData = new FormData()
  formData.append('language', language)

  const response = await fetch('../controllers/usuario.php?action=language', {
    method: 'POST',
    body: formData,
  })

  return response.json()
}

async function setupThemeSwitcher() {
  const themeRadios = document.querySelectorAll('input[name="theme"]')
  const user = await loadUserPreferences()
  const savedTheme = user?.theme_preference || localStorage.getItem('ferresoft.theme') || 'light'

  themeRadios.forEach((radio) => {
    radio.checked = radio.value === savedTheme
    radio.addEventListener('change', async (event) => {
      const selectedTheme = event.target.value
      applyTheme(selectedTheme)

      try {
        const result = await saveThemePreference(selectedTheme)
        if (!result.success) {
          showToast(result.message || translate('theme.saveError'), 'error')
          applyTheme('light')
          document.querySelector('input[name="theme"][value="light"]')?.click()
          return
        }

        if (currentUser) {
          currentUser.theme_preference = selectedTheme
        }

        showToast(translate('theme.updated'), 'success')
      } catch (error) {
        console.log('Error guardando el tema:', error)
        showToast(translate('theme.saveError'), 'error')
      }
    })
  })

  applyTheme(savedTheme)
}

async function setupLanguageSwitcher() {
  const languageSelect = document.getElementById('language')
  if (!languageSelect) return

  const user = await loadUserPreferences()
  const savedLanguage = user?.language_preference || getCurrentLanguage()
  languageSelect.value = savedLanguage
  setLanguage(savedLanguage)

  languageSelect.addEventListener('change', async (event) => {
    const selectedLanguage = event.target.value === 'en' ? 'en' : 'es'
    setLanguage(selectedLanguage)

    try {
      const result = await saveLanguagePreference(selectedLanguage)
      if (!result.success) {
        showToast(result.message || translate('language.saveError'), 'error')
        languageSelect.value = user?.language_preference || 'es'
        setLanguage(languageSelect.value)
        return
      }

      if (currentUser) {
        currentUser.language_preference = selectedLanguage
      }

      showToast(translate('language.updated'), 'success')
    } catch (error) {
      console.log('Error guardando el idioma:', error)
      showToast(translate('language.saveError'), 'error')
    }
  })
}

async function handlePasswordChange(event) {
  event.preventDefault()

  const newPass = document.getElementById('new_password').value
  const confirmPass = document.getElementById('confirm_password').value
  const messageDiv = document.getElementById('password-message')

  if (newPass !== confirmPass) {
    showToast('Las contraseñas no coinciden', 'error')
    return
  }

  const formData = new FormData()
  formData.append('password', newPass)

  try {
    const userResp = await fetch('../controllers/usuario.php?action=get')
    const userData = await userResp.json()

    if (!userData.success) {
      showToast('Error al obtener datos del usuario', 'error')
      return
    }

    formData.append('nombre', userData.user.nombre || '')
    formData.append('email', userData.user.email || '')
    formData.append('telefono', userData.user.telefono || '')
    formData.append('ciudad', userData.user.ciudad || '')
    formData.append('direccion', userData.user.direccion || '')
    formData.append('tipo_documento', userData.user.tipo_documento || '')
    formData.append('numero_documento', userData.user.numero_documento || '')

    const response = await fetch('../controllers/usuario.php?action=update', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    messageDiv.style.display = 'block'
    if (data.success) {
      messageDiv.style.color = '#166534'
      messageDiv.style.background = '#dcfce7'
      messageDiv.style.border = '1px solid #86efac'
      messageDiv.textContent = 'Contraseña actualizada correctamente'
      document.getElementById('password-form').reset()
    } else {
      messageDiv.style.color = '#991b1b'
      messageDiv.style.background = '#fee2e2'
      messageDiv.style.border = '1px solid #fca5a5'
      messageDiv.textContent = data.message
    }
  } catch (error) {
    console.error('Error actualizando la contraseña:', error)
    showToast('Error al procesar la solicitud', 'error')
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupThemeSwitcher()
  setupLanguageSwitcher()

  const passForm = document.getElementById('password-form')
  if (passForm) {
    passForm.addEventListener('submit', handlePasswordChange)
  }
})
