// Simple admin authentication (in production, use proper authentication)
const ADMIN_PASSWORD = "jorling2025admin"
let isAuthenticated = false

// Check admin authentication
document.addEventListener("DOMContentLoaded", () => {
  const adminAuth = localStorage.getItem("adminAuth")
  if (adminAuth !== ADMIN_PASSWORD) {
    const password = prompt("Ingrese la contraseña de administrador:")
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("adminAuth", ADMIN_PASSWORD)
      isAuthenticated = true
      initializeAdmin()
    } else {
      alert("Contraseña incorrecta")
      window.location.href = "index.html"
    }
  } else {
    isAuthenticated = true
    initializeAdmin()
  }
})

let users = []
let selectedUserId = null

function initializeAdmin() {
  loadUsers()
  loadStats()
  loadRecentOrders()
}

function loadUsers() {
  users = JSON.parse(localStorage.getItem("jorlingUsers")) || []
  displayUsers(users)
}

function loadStats() {
  const totalUsers = users.length
  const totalOrders = users.reduce((sum, user) => sum + user.orders.length, 0)
  const totalRevenue = users.reduce(
    (sum, user) => sum + user.orders.reduce((orderSum, order) => orderSum + order.price, 0),
    0,
  )

  const today = new Date().toDateString()
  const todayOrders = users.reduce(
    (sum, user) => sum + user.orders.filter((order) => new Date(order.createdAt).toDateString() === today).length,
    0,
  )

  document.getElementById("totalUsers").textContent = totalUsers
  document.getElementById("totalOrders").textContent = totalOrders
  document.getElementById("totalRevenue").textContent = `$${totalRevenue.toFixed(2)}`
  document.getElementById("todayOrders").textContent = todayOrders
}

function displayUsers(usersToShow) {
  const tbody = document.getElementById("usersTableBody")

  if (usersToShow.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: #999;">No hay usuarios registrados</td></tr>'
    return
  }

  const usersHTML = usersToShow
    .map(
      (user) => `
        <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>$${user.balance.toFixed(2)}</td>
            <td>${user.orders.length}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="action-btn btn-add-balance" onclick="showAddBalance(${user.id})">
                    <i class="fas fa-plus"></i> Añadir Saldo
                </button>
                <button class="action-btn btn-view-orders" onclick="viewUserOrders(${user.id})">
                    <i class="fas fa-eye"></i> Ver Pedidos
                </button>
            </td>
        </tr>
    `,
    )
    .join("")

  tbody.innerHTML = usersHTML
}

function searchUsers() {
  const searchTerm = document.getElementById("userSearch").value.toLowerCase()
  const filteredUsers = users.filter(
    (user) => user.username.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm),
  )
  displayUsers(filteredUsers)
}

function showAddBalance(userId) {
  selectedUserId = userId
  const user = users.find((u) => u.id === userId)

  document.getElementById("selectedUserName").value = user.username
  document.getElementById("currentBalance").value = `$${user.balance.toFixed(2)}`
  document.getElementById("amountToAdd").value = ""

  document.getElementById("addBalanceModal").style.display = "block"
}

function viewUserOrders(userId) {
  const user = users.find((u) => u.id === userId)
  if (user.orders.length === 0) {
    showMessage("Este usuario no tiene pedidos", "error")
    return
  }

  // Scroll to orders section and highlight user orders
  document.querySelector(".recent-orders-admin").scrollIntoView({ behavior: "smooth" })
  loadRecentOrders(userId)
}

function loadRecentOrders(filterUserId = null) {
  const tbody = document.getElementById("ordersTableBody")
  let allOrders = []

  users.forEach((user) => {
    user.orders.forEach((order) => {
      allOrders.push({
        ...order,
        username: user.username,
      })
    })
  })

  // Filter by user if specified
  if (filterUserId) {
    const user = users.find((u) => u.id === filterUserId)
    allOrders = allOrders.filter((order) => order.username === user.username)
  }

  // Sort by date (newest first)
  allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (allOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No hay pedidos</td></tr>'
    return
  }

  const serviceNames = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    facebook: "Facebook",
    twitter: "X (Twitter)",
    twitch: "Twitch",
    telegram: "Telegram",
  }

  const statusText = {
    pending: "Pendiente",
    processing: "Procesando",
    completed: "Completado",
  }

  const ordersHTML = allOrders
    .map(
      (order) => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.username}</td>
            <td>${serviceNames[order.service]}</td>
            <td>${order.quantity}</td>
            <td>$${order.price.toFixed(4)}</td>
            <td><span class="status-${order.status}">${statusText[order.status]}</span></td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        </tr>
    `,
    )
    .join("")

  tbody.innerHTML = ordersHTML
}

// Add balance form handler
document.getElementById("addBalanceForm").addEventListener("submit", (e) => {
  e.preventDefault()

  const amount = Number.parseFloat(document.getElementById("amountToAdd").value)
  if (amount <= 0) {
    showMessage("La cantidad debe ser mayor a 0", "error")
    return
  }

  // Find user and update balance
  const userIndex = users.findIndex((u) => u.id === selectedUserId)
  if (userIndex !== -1) {
    users[userIndex].balance += amount

    // Save to localStorage
    localStorage.setItem("jorlingUsers", JSON.stringify(users))

    // Update displays
    loadUsers()
    loadStats()

    // Close modal
    closeModal("addBalanceModal")

    showMessage(`Se añadieron $${amount.toFixed(2)} al usuario ${users[userIndex].username}`, "success")
  }
})

// Quick recharge functions
function showQuickRecharge() {
  document.getElementById("quickRechargeModal").style.display = "block"
  loadUserSuggestions()
}

function showBulkRecharge() {
  document.getElementById("bulkRechargeModal").style.display = "block"
  loadUserCheckboxes()
}

function setQuickAmount(amount) {
  document.getElementById("quickAmount").value = amount
}

function loadUserSuggestions() {
  const searchInput = document.getElementById("quickUserSearch")
  const suggestionsDiv = document.getElementById("userSuggestions")

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase()
    if (searchTerm.length < 2) {
      suggestionsDiv.innerHTML = ""
      return
    }

    const filteredUsers = users.filter(
      (user) => user.username.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm),
    )

    const suggestionsHTML = filteredUsers
      .map(
        (user) => `
      <div class="suggestion-item" onclick="selectUser('${user.username}')">
        <strong>${user.username}</strong> (${user.email}) - $${user.balance.toFixed(2)}
      </div>
    `,
      )
      .join("")

    suggestionsDiv.innerHTML = suggestionsHTML
  })
}

function selectUser(username) {
  document.getElementById("quickUserSearch").value = username
  document.getElementById("userSuggestions").innerHTML = ""
}

function loadUserCheckboxes() {
  const checkboxesDiv = document.getElementById("userCheckboxes")

  const checkboxesHTML = users
    .map(
      (user) => `
    <label class="user-checkbox">
      <input type="checkbox" value="${user.id}" onchange="updateBulkSummary()">
      <span>${user.username} (${user.email}) - $${user.balance.toFixed(2)}</span>
    </label>
  `,
    )
    .join("")

  checkboxesDiv.innerHTML = checkboxesHTML
}

function updateBulkSummary() {
  const checkboxes = document.querySelectorAll('#userCheckboxes input[type="checkbox"]:checked')
  const amount = Number.parseFloat(document.getElementById("bulkAmount").value) || 0

  document.getElementById("selectedCount").textContent = checkboxes.length
  document.getElementById("totalBulkAmount").textContent = (checkboxes.length * amount).toFixed(2)
}

// Quick recharge form handler
document.getElementById("quickRechargeForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const username = document.getElementById("quickUserSearch").value
  const amount = Number.parseFloat(document.getElementById("quickAmount").value)

  if (!username || !amount || amount <= 0) {
    showMessage("Por favor completa todos los campos correctamente", "error")
    return
  }

  const userIndex = users.findIndex(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase(),
  )

  if (userIndex === -1) {
    showMessage("Usuario no encontrado", "error")
    return
  }

  // Add balance
  users[userIndex].balance += amount
  localStorage.setItem("jorlingUsers", JSON.stringify(users))

  // Update displays
  loadUsers()
  loadStats()

  // Close modal and clear form
  closeModal("quickRechargeModal")
  document.getElementById("quickRechargeForm").reset()

  showMessage(`¡Recarga exitosa! Se añadieron $${amount.toFixed(2)} a ${users[userIndex].username}`, "success")
})

function processBulkRecharge() {
  const checkboxes = document.querySelectorAll('#userCheckboxes input[type="checkbox"]:checked')
  const amount = Number.parseFloat(document.getElementById("bulkAmount").value)

  if (checkboxes.length === 0 || !amount || amount <= 0) {
    showMessage("Selecciona usuarios y un monto válido", "error")
    return
  }

  let processedCount = 0

  checkboxes.forEach((checkbox) => {
    const userId = Number.parseInt(checkbox.value)
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex !== -1) {
      users[userIndex].balance += amount
      processedCount++
    }
  })

  // Save changes
  localStorage.setItem("jorlingUsers", JSON.stringify(users))

  // Update displays
  loadUsers()
  loadStats()

  // Close modal
  closeModal("bulkRechargeModal")

  const totalAmount = processedCount * amount
  showMessage(
    `¡Recarga masiva exitosa! Se añadieron $${totalAmount.toFixed(2)} a ${processedCount} usuarios`,
    "success",
  )
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none"
}

function showMessage(text, type = "success") {
  const messageElement = document.getElementById(type + "Message")
  const textElement = document.getElementById(type + "Text")

  textElement.textContent = text
  messageElement.style.display = "flex"

  setTimeout(() => {
    messageElement.style.display = "none"
  }, 5000)
}

function refreshData() {
  loadUsers()
  loadStats()
  loadRecentOrders()
  showMessage("Datos actualizados correctamente", "success")
}

function exportUsers() {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    "ID,Usuario,Email,Saldo,Pedidos,Fecha Registro\n" +
    users
      .map(
        (user) =>
          `${user.id},${user.username},${user.email},${user.balance.toFixed(2)},${user.orders.length},${new Date(user.createdAt).toLocaleDateString()}`,
      )
      .join("\n")

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `usuarios_jorling_${new Date().toISOString().split("T")[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  showMessage("Archivo de usuarios exportado exitosamente", "success")
}

// Update bulk amount listener
document.getElementById("bulkAmount").addEventListener("input", updateBulkSummary)

function logout() {
  localStorage.removeItem("adminAuth")
  window.location.href = "index.html"
}

// Close modals when clicking outside
window.onclick = (event) => {
  const modals = ["addBalanceModal", "quickRechargeModal", "bulkRechargeModal"]
  modals.forEach((modalId) => {
    const modal = document.getElementById(modalId)
    if (event.target === modal) {
      closeModal(modalId)
    }
  })
}

// Auto-refresh data every 30 seconds
setInterval(() => {
  loadUsers()
  loadStats()
  loadRecentOrders()
}, 30000)
