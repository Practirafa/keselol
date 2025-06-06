// Database simulation (in production, this would be handled by the backend)
const users = JSON.parse(localStorage.getItem("jorlingUsers")) || []

// Modal functions
function showLogin() {
  document.getElementById("loginModal").style.display = "block"
}

function showRegister() {
  document.getElementById("registerModal").style.display = "block"
}

function showForgotPassword() {
  document.getElementById("forgotModal").style.display = "block"
  closeModal("loginModal")
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none"
}

// Message functions
function showMessage(text, type = "success") {
  const messageElement = document.getElementById(type + "Message")
  const textElement = document.getElementById(type + "Text")

  textElement.textContent = text
  messageElement.style.display = "flex"

  setTimeout(() => {
    messageElement.style.display = "none"
  }, 5000)
}

// Form handlers
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const username = document.getElementById("registerUsername").value
  const email = document.getElementById("registerEmail").value
  const password = document.getElementById("registerPassword").value
  const confirmPassword = document.getElementById("confirmPassword").value

  // Validation
  if (password !== confirmPassword) {
    showMessage("Las contraseñas no coinciden", "error")
    return
  }

  if (users.find((user) => user.email === email)) {
    showMessage("Este correo ya está registrado", "error")
    return
  }

  if (users.find((user) => user.username === username)) {
    showMessage("Este nombre de usuario ya existe", "error")
    return
  }

  // Create new user
  const newUser = {
    id: Date.now(),
    username: username,
    email: email,
    password: password, // In production, this should be hashed
    balance: 0.0,
    orders: [],
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  localStorage.setItem("jorlingUsers", JSON.stringify(users))

  showMessage("¡Registro exitoso! Ya puedes iniciar sesión", "success")
  closeModal("registerModal")

  // Clear form
  document.getElementById("registerForm").reset()
})

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault()

  const emailOrUsername = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  const user = users.find(
    (u) => (u.email === emailOrUsername || u.username === emailOrUsername) && u.password === password,
  )

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user))
    showMessage("¡Inicio de sesión exitoso!", "success")
    closeModal("loginModal")

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      window.location.href = "dashboard.html"
    }, 2000)
  } else {
    showMessage("Credenciales incorrectas", "error")
  }
})

document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const email = document.getElementById("forgotEmail").value
  const user = users.find((u) => u.email === email)

  if (user) {
    // Simulate sending email
    showMessage("Se ha enviado un enlace de recuperación a tu correo", "success")
    closeModal("forgotModal")

    // In production, this would trigger an actual email API
    console.log("Password reset email would be sent to:", email)
  } else {
    showMessage("No se encontró una cuenta con este correo", "error")
  }
})

// Close modals when clicking outside
window.onclick = (event) => {
  const modals = ["loginModal", "registerModal", "forgotModal"]
  modals.forEach((modalId) => {
    const modal = document.getElementById(modalId)
    if (event.target === modal) {
      closeModal(modalId)
    }
  })
}

// Electric effects
function createElectricParticle() {
  const particle = document.createElement("div")
  particle.style.position = "fixed"
  particle.style.width = "2px"
  particle.style.height = "2px"
  particle.style.background = "#00ffff"
  particle.style.borderRadius = "50%"
  particle.style.pointerEvents = "none"
  particle.style.zIndex = "999"
  particle.style.boxShadow = "0 0 10px #00ffff"

  particle.style.left = Math.random() * window.innerWidth + "px"
  particle.style.top = Math.random() * window.innerHeight + "px"

  document.body.appendChild(particle)

  // Animate particle
  const animation = particle.animate(
    [
      { opacity: 0, transform: "scale(0)" },
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0)" },
    ],
    {
      duration: 2000,
      easing: "ease-in-out",
    },
  )

  animation.onfinish = () => {
    particle.remove()
  }
}

// Create electric particles periodically
setInterval(createElectricParticle, 500)

// Animaciones para contadores en tiempo real
function animateCounters() {
  const counters = [
    { id: "totalViews", target: 15847293, increment: 1247 },
    { id: "totalFollowers", target: 2456891, increment: 89 },
    { id: "totalLikes", target: 8923456, increment: 456 },
    { id: "liveViews", target: 1234, increment: 12 },
    { id: "liveFollowers", target: 567, increment: 3 },
    { id: "activeOrders", target: 23, increment: 1 },
  ]

  counters.forEach((counter) => {
    const element = document.getElementById(counter.id)
    if (element) {
      let current = 0
      const increment = counter.target / 100

      const updateCounter = () => {
        if (current < counter.target) {
          current += increment
          if (counter.id.includes("total")) {
            element.textContent = Math.floor(current).toLocaleString()
          } else {
            element.textContent = Math.floor(current)
          }
          setTimeout(updateCounter, 50)
        } else {
          element.textContent = counter.target.toLocaleString()
        }
      }

      updateCounter()
    }
  })
}

// Actualizar contadores en vivo cada 5 segundos
function updateLiveCounters() {
  const liveViews = document.getElementById("liveViews")
  const liveFollowers = document.getElementById("liveFollowers")
  const activeOrders = document.getElementById("activeOrders")

  if (liveViews) {
    const currentViews = Number.parseInt(liveViews.textContent) || 0
    liveViews.textContent = currentViews + Math.floor(Math.random() * 15) + 5
  }

  if (liveFollowers) {
    const currentFollowers = Number.parseInt(liveFollowers.textContent) || 0
    liveFollowers.textContent = currentFollowers + Math.floor(Math.random() * 8) + 2
  }

  if (activeOrders) {
    const currentOrders = Number.parseInt(activeOrders.textContent) || 0
    const change = Math.floor(Math.random() * 3) - 1 // -1, 0, o 1
    activeOrders.textContent = Math.max(15, currentOrders + change)
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Delay para que se vean las animaciones
  setTimeout(animateCounters, 1000)

  // Actualizar contadores en vivo cada 5 segundos
  setInterval(updateLiveCounters, 5000)

  // Check if user is already logged in
  const currentUser = localStorage.getItem("currentUser")
  if (currentUser && window.location.pathname.includes("index.html")) {
    // User is logged in, could redirect to dashboard
    console.log("User already logged in")
  }
})
