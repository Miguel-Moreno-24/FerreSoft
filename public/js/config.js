// Lógica para cambiar de tema (claro / oscuro)
function setupThemeSwitcher() {
  const themeRadios = document.getElementsByName('theme');
  const savedTheme = localStorage.getItem('theme') || 'light';

  // Marcar la opción guardada
  themeRadios.forEach(radio => {
    if (radio.value === savedTheme) {
      radio.checked = true;
    }

    radio.addEventListener('change', (e) => {
      const selectedTheme = e.target.value;
      setTheme(selectedTheme);
    });
  });

  // Aplicar tema inicial
  setTheme(savedTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Lógica para cambiar contraseña
async function handlePasswordChange(e) {
  e.preventDefault();

  const newPass = document.getElementById("new_password").value;
  const confirmPass = document.getElementById("confirm_password").value;
  const messageDiv = document.getElementById("password-message");

  if (newPass !== confirmPass) {
    showToast("Las contraseñas no coinciden", "error");
    return;
  }

  const formData = new FormData();
  formData.append("password", newPass);
  
  // Necesitamos enviar el nombre y el correo actuales para que usuario.php no falle en validaciones
  // Obtenemos los datos actuales primero
  try {
    const userResp = await fetch("../controllers/usuario.php?action=get");
    const userData = await userResp.json();
    
    if (!userData.success) {
      showToast("Error al obtener datos del usuario", "error");
      return;
    }

    formData.append("nombre", userData.user.nombre);
    formData.append("email", userData.user.email);
    formData.append("telefono", userData.user.telefono);
    formData.append("ciudad", userData.user.ciudad);
    formData.append("direccion", userData.user.direccion);
    formData.append("tipo_documento", userData.user.tipo_documento);
    formData.append("numero_documento", userData.user.numero_documento);

    const response = await fetch("../controllers/usuario.php?action=update", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      messageDiv.style.color = "#22c55e";
      messageDiv.textContent = "Contraseña actualizada correctamente";
      messageDiv.style.display = "block";
      document.getElementById("password-form").reset();
      
      setTimeout(() => {
        messageDiv.style.display = "none";
      }, 3000);
    } else {
      messageDiv.style.color = "#ef4444";
      messageDiv.textContent = data.message;
      messageDiv.style.display = "block";
    }
  } catch (error) {
    console.error("Error updating password:", error);
    showToast("Error al procesar la solicitud", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupThemeSwitcher();
  
  const passForm = document.getElementById("password-form");
  if (passForm) {
    passForm.addEventListener("submit", handlePasswordChange);
  }
});
