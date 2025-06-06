// Simple admin authentication (in production, use proper authentication)
const ADMIN_PASSWORD = "jorling2025admin"
let isAuthenticated = false

// Configuración para sincronización mejorada
const SYNC_CONFIG = {
  STORAGE_KEY: "jorlingUsers",
  SYNC_INTERVAL: 15000, // 15 segundos
  MAX_RETRIES: 3,
  BACKUP_KEYS: ["jorlingUsersBackup", "jorlingUsersSession"],
}

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
let selectedOrderData = null
let syncInterval = null

// Función para detectar tipo de dispositivo
function detectDeviceType() {
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  return isMobile ? "mobile" : "desktop"
}

// Sistema de sincronización mejorado
class DataSyncManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.lastSyncTime = null
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Detectar cambios de conectividad
    window.addEventListener("online", () => {
      this.isOnline = true
      console.log("🌐 Conexión restaurada - Sincronizando...")
      this.syncAllData()
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
      console.log("📴 Sin conexión - Modo offline")
    })

    // Escuchar cambios en localStorage desde otras pestañas/ventanas
    window.addEventListener("storage", (e) => {
      if (e.key === SYNC_CONFIG.STORAGE_KEY || SYNC_CONFIG.BACKUP_KEYS.includes(e.key)) {
        console.log("🔄 Datos actualizados desde otra pestaña:", e.key)
        this.loadAndMergeData()
      }
    })

    // Sincronizar cuando la pestaña se vuelve visible
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        console.log("👁️ Pestaña visible - Sincronizando...")
        this.syncAllData()
      }
    })

    // Sincronizar antes de cerrar la pestaña
    window.addEventListener("beforeunload", () => {
      this.saveToAllSources()
    })
  }

  // Cargar datos desde múltiples fuentes
  async loadAndMergeData() {
    try {
      console.log("📥 Cargando datos desde múltiples fuentes...")

      // Fuente 1: localStorage principal
      const localData = this.getFromStorage(localStorage, SYNC_CONFIG.STORAGE_KEY)

      // Fuente 2: sessionStorage
      const sessionData = this.getFromStorage(sessionStorage, SYNC_CONFIG.STORAGE_KEY)

      // Fuente 3: localStorage backup
      const backupData = this.getFromStorage(localStorage, SYNC_CONFIG.BACKUP_KEYS[0])

      // Fuente 4: sessionStorage backup
      const sessionBackupData = this.getFromStorage(sessionStorage, SYNC_CONFIG.BACKUP_KEYS[1])

      // Combinar todos los datos
      const allSources = [localData, sessionData, backupData, sessionBackupData]
      const mergedUsers = this.mergeUserData(allSources)

      // Actualizar datos globales
      users = mergedUsers

      // Guardar datos consolidados
      this.saveToAllSources()

      console.log(`✅ Datos sincronizados: ${users.length} usuarios encontrados`)
      this.lastSyncTime = new Date()

      return users
    } catch (error) {
      console.error("❌ Error al cargar datos:", error)
      return []
    }
  }

  getFromStorage(storage, key) {
    try {
      const data = storage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.warn(`⚠️ Error al leer ${key}:`, error)
      return []
    }
  }

  // Combinar y deduplicar datos de usuarios
  mergeUserData(dataSources) {
    const allUsers = []
    const seenEmails = new Set()
    const seenIds = new Set()

    // Procesar cada fuente de datos
    dataSources.forEach((source, index) => {
      if (Array.isArray(source)) {
        source.forEach((user) => {
          // Validar que el usuario tenga datos mínimos
          if (user && (user.email || user.id)) {
            const identifier = user.email || user.id

            // Evitar duplicados por email o ID
            if (!seenEmails.has(user.email) && !seenIds.has(user.id)) {
              // Enriquecer datos del usuario
              const enrichedUser = {
                ...user,
                // Asegurar campos obligatorios
                id: user.id || Date.now() + Math.random(),
                username: user.username || "Usuario",
                email: user.email || "sin-email@ejemplo.com",
                balance: user.balance || 0,
                orders: user.orders || [],
                createdAt: user.createdAt || new Date().toISOString(),

                // Información de sincronización
                deviceType: user.deviceType || detectDeviceType(),
                lastSeen: new Date().toISOString(),
                syncSource: `source_${index}`,
                syncedAt: new Date().toISOString(),
              }

              allUsers.push(enrichedUser)
              seenEmails.add(user.email)
              seenIds.add(user.id)
            }
          }
        })
      }
    })

    // Ordenar por fecha de creación (más recientes primero)
    return allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  // Guardar en todas las fuentes de almacenamiento
  saveToAllSources() {
    try {
      const userData = JSON.stringify(users)

      // Guardar en localStorage principal
      localStorage.setItem(SYNC_CONFIG.STORAGE_KEY, userData)

      // Guardar en sessionStorage
      sessionStorage.setItem(SYNC_CONFIG.STORAGE_KEY, userData)

      // Guardar backups
      localStorage.setItem(SYNC_CONFIG.BACKUP_KEYS[0], userData)
      sessionStorage.setItem(SYNC_CONFIG.BACKUP_KEYS[1], userData)

      console.log("💾 Datos guardados en todas las fuentes")
    } catch (error) {
      console.error("❌ Error al guardar datos:", error)
    }
  }

  // Sincronización completa
  async syncAllData() {
    try {
      await this.loadAndMergeData()

      // Actualizar interfaz
      if (typeof loadUsers === "function") loadUsers()
      if (typeof loadStats === "function") loadStats()
      if (typeof loadRecentOrders === "function") loadRecentOrders()

      return true
    } catch (error) {
      console.error("❌ Error en sincronización:", error)
      return false
    }
  }

  // Forzar sincronización manual
  async forceSync() {
    console.log("🔄 Sincronización forzada iniciada...")
    return await this.syncAllData()
  }
}

// Instancia global del gestor de sincronización
let syncManager = null

function initializeAdmin() {
  // Inicializar gestor de sincronización
  syncManager = new DataSyncManager()

  // Cargar datos iniciales con sincronización
  syncManager.syncAllData().then(() => {
    loadUsers()
    loadStats()
    loadRecentOrders()
    setupEventListeners()
  })

  // Configurar sincronización automática
  syncInterval = setInterval(() => {
    if (syncManager) {
      syncManager.syncAllData()
    }
  }, SYNC_CONFIG.SYNC_INTERVAL)

  console.log("🚀 Panel de administración inicializado con sincronización mejorada")
}

// Función mejorada para cargar usuarios
function loadUsers() {
  // Los usuarios ya están cargados por syncManager
  displayUsers(users)
  console.log(`👥 Mostrando ${users.length} usuarios`)
}

function loadStats() {
  const totalUsers = users.length
  const totalOrders = users.reduce((sum, user) => sum + (user.orders ? user.orders.length : 0), 0)
  const totalRevenue = users.reduce(
    (sum, user) => sum + (user.orders ? user.orders.reduce((orderSum, order) => orderSum + (order.price || 0), 0) : 0),
    0,
  )

  const today = new Date().toDateString()
  const todayRefunds = users.reduce(
    (sum, user) =>
      sum +
      (user.orders
        ? user.orders.filter(
            (order) => order.status === "refunded" && new Date(order.refundedAt || "").toDateString() === today,
          ).length
        : 0),
    0,
  )

  document.getElementById("totalUsers").textContent = totalUsers
  document.getElementById("totalOrders").textContent = totalOrders
  document.getElementById("totalRevenue").textContent = `$${totalRevenue.toFixed(2)}`
  document.getElementById("todayRefunds").textContent = todayRefunds
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
            <td>
                ${user.username}
                <small style="display: block; color: #999; font-size: 0.8em;">
                    ${user.deviceType === "mobile" ? "📱 Móvil" : "💻 PC"}
                </small>
            </td>
            <td>${user.email}</td>
            <td>$${(user.balance || 0).toFixed(2)}</td>
            <td>${user.orders ? user.orders.length : 0}</td>
            <td>
                ${new Date(user.createdAt).toLocaleDateString()}
                <small style="display: block; color: #999; font-size: 0.8em;">
                    ${user.lastSeen ? new Date(user.lastSeen).toLocaleTimeString() : ""}
                </small>
            </td>
            <td>
                <button class="action-btn btn-add-balance" onclick="showAddBalance(${user.id})">
                    <i class="fas fa-plus"></i> Añadir Saldo
                </button>
                <button class="action-btn btn-view-orders" onclick="viewUserOrders(${user.id})">
                    <i class="fas fa-eye"></i> Ver Pedidos
                </button>
                <button class="action-btn btn-delete-user" onclick="showDeleteAccountModal(${user.id})">
                    <i class="fas fa-user-times"></i> Eliminar
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

// Función mejorada para guardar datos
function saveUserData() {
  if (syncManager) {
    syncManager.saveToAllSources()
  } else {
    // Fallback si syncManager no está disponible
    localStorage.setItem(SYNC_CONFIG.STORAGE_KEY, JSON.stringify(users))
  }
}

function showAddBalance(userId) {
  selectedUserId = userId
  const user = users.find((u) => u.id === userId)

  document.getElementById("selectedUserName").value = user.username
  document.getElementById("currentBalance").value = `$${(user.balance || 0).toFixed(2)}`
  document.getElementById("amountToAdd").value = ""

  document.getElementById("addBalanceModal").style.display = "block"
}

function viewUserOrders(userId) {
  const user = users.find((u) => u.id === userId)
  if (!user.orders || user.orders.length === 0) {
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
    if (user.orders) {
      user.orders.forEach((order) => {
        allOrders.push({
          ...order,
          username: user.username,
          userId: user.id,
        })
      })
    }
  })

  // Filter by user if specified
  if (filterUserId) {
    const user = users.find((u) => u.id === filterUserId)
    allOrders = allOrders.filter((order) => order.username === user.username)
  }

  // Sort by date (newest first)
  allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (allOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #999;">No hay pedidos</td></tr>'
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
    failed: "Fallido",
    refunded: "Reembolsado",
    cancelled: "Cancelado",
  }

  const ordersHTML = allOrders
    .map(
      (order) => `
        <tr>
            <td>ORD-${order.id}</td>
            <td>${order.username}</td>
            <td>${serviceNames[order.service] || order.service}</td>
            <td><a href="${order.url}" target="_blank" style="color: #4ecdc4;">${order.url ? order.url.substring(0, 30) + "..." : "N/A"}</a></td>
            <td>${order.quantity || 0}</td>
            <td>$${(order.price || 0).toFixed(4)}</td>
            <td><span class="status-${order.status}">${statusText[order.status] || "Desconocido"}${order.accelerated ? " 🚀" : ""}</span></td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
                ${
                  order.status !== "refunded" && order.status !== "completed" && order.status !== "cancelled"
                    ? `<button class="action-btn btn-acceleration" onclick="showMassAccelerationModal('${order.id}', '${order.username}', '${order.service}', ${order.quantity || 0}, ${order.progress || 0})" title="Aceleración Masiva">
                        <i class="fas fa-rocket"></i>
                    </button>
                    <button class="action-btn btn-refund" onclick="showRefundModal('${order.id}', '${order.username}', '${order.service}', ${order.price || 0})" title="Procesar Reembolso">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="action-btn btn-cancel" onclick="showCancelOrderModal('${order.id}', '${order.username}', '${order.service}', ${order.price || 0})" title="Cancelar Pedido">
                        <i class="fas fa-times"></i>
                    </button>`
                    : ""
                }
                <button class="action-btn btn-view" onclick="viewUserDetails(${order.userId})" title="Ver Usuario">
                    <i class="fas fa-user"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("")

  tbody.innerHTML = ordersHTML
}

// Actualizar setupEventListeners para incluir los nuevos formularios
function setupEventListeners() {
  // Order search form
  document.getElementById("orderSearchForm").addEventListener("submit", (e) => {
    e.preventDefault()
    searchOrderById()
  })

  // Quick recharge form
  document.getElementById("quickRechargeForm").addEventListener("submit", (e) => {
    e.preventDefault()
    processQuickRecharge()
  })

  // Add balance form
  document.getElementById("addBalanceForm").addEventListener("submit", (e) => {
    e.preventDefault()
    processAddBalance()
  })

  // Mass acceleration form
  document.getElementById("massAccelerationForm").addEventListener("submit", (e) => {
    e.preventDefault()
    processMassAcceleration()
  })

  // Refund form
  document.getElementById("refundForm").addEventListener("submit", (e) => {
    e.preventDefault()
    processRefund()
  })

  // Cancel order form
  document.getElementById("cancelOrderForm").addEventListener("submit", (e) => {
    e.preventDefault()
    processCancelOrder()
  })

  // Delete account form
  document.getElementById("deleteAccountForm").addEventListener("submit", (e) => {
    e.preventDefault()
    processDeleteAccount()
  })

  // Acceleration reason change
  document.getElementById("accelerationReason").addEventListener("change", function () {
    const otherReasonGroup = document.getElementById("accelerationOtherReasonGroup")
    if (this.value === "other") {
      otherReasonGroup.style.display = "block"
    } else {
      otherReasonGroup.style.display = "none"
    }
  })

  // Refund reason change
  document.getElementById("refundReason").addEventListener("change", function () {
    const otherReasonGroup = document.getElementById("otherReasonGroup")
    if (this.value === "other") {
      otherReasonGroup.style.display = "block"
    } else {
      otherReasonGroup.style.display = "none"
    }
  })

  // Cancel reason change
  document.getElementById("cancelReason").addEventListener("change", function () {
    const otherReasonGroup = document.getElementById("cancelOtherReasonGroup")
    if (this.value === "other") {
      otherReasonGroup.style.display = "block"
    } else {
      otherReasonGroup.style.display = "none"
    }
  })

  // Delete reason change
  document.getElementById("deleteReason").addEventListener("change", function () {
    const otherReasonGroup = document.getElementById("deleteOtherReasonGroup")
    if (this.value === "other") {
      otherReasonGroup.style.display = "block"
    } else {
      otherReasonGroup.style.display = "none"
    }
  })

  // User search suggestions
  document.getElementById("quickUserSearch").addEventListener("input", () => {
    loadUserSuggestions()
  })
}

function showOrderSearch() {
  document.getElementById("orderSearchModal").style.display = "block"
}

function searchOrderById() {
  const orderId = document.getElementById("orderIdSearch").value.trim()
  const resultsDiv = document.getElementById("orderSearchResults")

  if (!orderId) {
    showMessage("Por favor ingresa un ID de pedido", "error")
    return
  }

  // Buscar el pedido en todos los usuarios
  let foundOrder = null
  let foundUser = null

  for (const user of users) {
    if (user.orders) {
      for (const order of user.orders) {
        if (order.id.toString() === orderId || `ORD-${order.id}` === orderId) {
          foundOrder = order
          foundUser = user
          break
        }
      }
    }
    if (foundOrder) break
  }

  if (foundOrder) {
    const statusText = {
      pending: "Pendiente",
      processing: "Procesando",
      completed: "Completado",
      failed: "Fallido",
      refunded: "Reembolsado",
      cancelled: "Cancelado",
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

    resultsDiv.innerHTML = `
            <div class="order-result">
                <h3>Pedido Encontrado</h3>
                <div class="order-details">
                    <p><strong>ID:</strong> ORD-${foundOrder.id}</p>
                    <p><strong>Usuario:</strong> ${foundUser.username} (${foundUser.email})</p>
                    <p><strong>Servicio:</strong> ${serviceNames[foundOrder.service] || foundOrder.service}</p>
                    <p><strong>URL:</strong> <a href="${foundOrder.url}" target="_blank">${foundOrder.url}</a></p>
                    <p><strong>Cantidad:</strong> ${foundOrder.quantity}</p>
                    <p><strong>Precio:</strong> $${foundOrder.price.toFixed(4)}</p>
                    <p><strong>Estado:</strong> <span class="status-${foundOrder.status}">${statusText[foundOrder.status]}</span></p>
                    <p><strong>Fecha:</strong> ${new Date(foundOrder.createdAt).toLocaleString()}</p>
                    ${foundOrder.progress ? `<p><strong>Progreso:</strong> ${foundOrder.progress.toFixed(1)}%</p>` : ""}
                </div>
                <div class="order-actions">
                    ${
                      foundOrder.status !== "refunded" &&
                      foundOrder.status !== "completed" &&
                      foundOrder.status !== "cancelled"
                        ? `<button class="btn-acceleration" onclick="showMassAccelerationModal('${foundOrder.id}', '${foundUser.username}', '${foundOrder.service}', ${foundOrder.quantity}, ${foundOrder.progress || 0})">
                            <i class="fas fa-rocket"></i> Aceleración Masiva
                        </button>
                        <button class="btn-refund" onclick="showRefundModal('${foundOrder.id}', '${foundUser.username}', '${foundOrder.service}', ${foundOrder.price})">
                            <i class="fas fa-undo"></i> Procesar Reembolso
                        </button>`
                        : ""
                    }
                    <button class="btn-view-user" onclick="viewUserDetails(${foundUser.id})">
                        <i class="fas fa-user"></i> Ver Usuario
                    </button>
                </div>
            </div>
        `
  } else {
    resultsDiv.innerHTML = `
            <div class="order-result">
                <p style="color: #ff6b6b; text-align: center;">
                    <i class="fas fa-exclamation-circle"></i>
                    No se encontró ningún pedido con ID: ${orderId}
                </p>
            </div>
        `
  }
}

function showMassAccelerationModal(orderId, username, service, quantity, progress) {
  selectedOrderData = { id: orderId, username, service, quantity, progress }

  document.getElementById("accelerationOrderId").value = `ORD-${orderId}`
  document.getElementById("accelerationUserName").value = username
  document.getElementById("accelerationService").value = service
  document.getElementById("accelerationQuantity").value = quantity
  document.getElementById("accelerationProgress").value = `${progress.toFixed(1)}%`

  closeModal("orderSearchModal")
  document.getElementById("massAccelerationModal").style.display = "block"
}

function processMassAcceleration() {
  if (!selectedOrderData) {
    showMessage("Error: No hay datos de pedido seleccionados", "error")
    return
  }

  const accelerationType = document.querySelector('input[name="accelerationType"]:checked').value
  const reason = document.getElementById("accelerationReason").value
  const otherReason = document.getElementById("accelerationOtherReason").value

  if (!reason) {
    showMessage("Por favor selecciona un motivo para la aceleración", "error")
    return
  }

  if (reason === "other" && !otherReason.trim()) {
    showMessage("Por favor especifica el motivo de la aceleración", "error")
    return
  }

  // Buscar y actualizar el pedido
  let orderFound = false
  for (const user of users) {
    if (user.orders) {
      for (const order of user.orders) {
        if (order.id.toString() === selectedOrderData.id.toString()) {
          // Activar aceleración masiva
          order.accelerated = true
          order.accelerationType = accelerationType
          order.acceleratedAt = new Date().toISOString()
          order.accelerationReason = reason === "other" ? otherReason : reason
          order.acceleratedBy = "admin"
          order.status = "processing"

          // Establecer tiempo estimado según tipo de aceleración
          const accelerationTimes = {
            turbo: "1-2 horas",
            super: "30 minutos",
            instant: "5-10 minutos",
          }
          order.estimatedCompletion = accelerationTimes[accelerationType]

          orderFound = true
          break
        }
      }
    }
    if (orderFound) break
  }

  if (orderFound) {
    // Guardar cambios con sincronización
    saveUserData()

    // Registrar la aceleración
    const accelerationRecord = {
      orderId: selectedOrderData.id,
      username: selectedOrderData.username,
      accelerationType: accelerationType,
      reason: reason === "other" ? otherReason : reason,
      processedAt: new Date().toISOString(),
      processedBy: "admin",
    }

    const accelerations = JSON.parse(localStorage.getItem("jorlingAccelerations")) || []
    accelerations.push(accelerationRecord)
    localStorage.setItem("jorlingAccelerations", JSON.stringify(accelerations))

    // Simular activación de bots especiales
    activateSpecialBots(selectedOrderData.id, accelerationType)

    // Actualizar displays
    loadUsers()
    loadStats()
    loadRecentOrders()

    // Cerrar modal y mostrar éxito
    closeModal("massAccelerationModal")
    const accelerationNames = {
      turbo: "Turbo (2x velocidad)",
      super: "Super (5x velocidad)",
      instant: "Instantáneo (10x velocidad)",
    }
    showMessage(
      `¡Aceleración ${accelerationNames[accelerationType]} activada para el pedido ORD-${selectedOrderData.id}!`,
      "success",
    )

    selectedOrderData = null
  } else {
    showMessage("Error: No se pudo encontrar el pedido para acelerar", "error")
  }
}

function activateSpecialBots(orderId, accelerationType) {
  // Simular activación de bots especiales
  console.log(`🚀 Activando bots especiales para pedido ORD-${orderId}`)
  console.log(`⚡ Tipo de aceleración: ${accelerationType}`)

  // Aquí se conectaría con el sistema real de bots
  // Por ahora solo simulamos la activación
  const botCounts = {
    turbo: 50,
    super: 100,
    instant: 200,
  }

  console.log(`🤖 Activando ${botCounts[accelerationType]} bots especiales`)

  // Simular progreso acelerado
  setTimeout(() => {
    updateOrderProgress(orderId, accelerationType)
  }, 1000)
}

function updateOrderProgress(orderId, accelerationType) {
  // Simular progreso acelerado del pedido
  const progressRates = {
    turbo: 2, // 2% cada segundo
    super: 5, // 5% cada segundo
    instant: 10, // 10% cada segundo
  }

  const rate = progressRates[accelerationType]
  let currentProgress = 0

  const progressInterval = setInterval(() => {
    currentProgress += rate

    if (currentProgress >= 100) {
      currentProgress = 100
      clearInterval(progressInterval)

      // Marcar pedido como completado
      for (const user of users) {
        if (user.orders) {
          for (const order of user.orders) {
            if (order.id.toString() === orderId.toString()) {
              order.status = "completed"
              order.progress = 100
              order.completedAt = new Date().toISOString()
              break
            }
          }
        }
      }

      saveUserData()
      loadRecentOrders()

      showMessage(`¡Pedido ORD-${orderId} completado con aceleración masiva!`, "success")
    }

    console.log(`📊 Progreso del pedido ORD-${orderId}: ${currentProgress}%`)
  }, 1000)
}

function showRefundModal(orderId, username, service, price) {
  selectedOrderData = { id: orderId, username, service, price }

  document.getElementById("refundOrderId").value = `ORD-${orderId}`
  document.getElementById("refundUserName").value = username
  document.getElementById("refundService").value = service
  document.getElementById("refundAmount").value = `$${price.toFixed(4)}`

  closeModal("orderSearchModal")
  document.getElementById("refundModal").style.display = "block"
}

function processRefund() {
  if (!selectedOrderData) {
    showMessage("Error: No hay datos de pedido seleccionados", "error")
    return
  }

  const reason = document.getElementById("refundReason").value
  const otherReason = document.getElementById("otherReason").value

  if (!reason) {
    showMessage("Por favor selecciona un motivo para el reembolso", "error")
    return
  }

  if (reason === "other" && !otherReason.trim()) {
    showMessage("Por favor especifica el motivo del reembolso", "error")
    return
  }

  // Buscar y actualizar el pedido
  let orderFound = false
  for (const user of users) {
    if (user.orders) {
      for (const order of user.orders) {
        if (order.id.toString() === selectedOrderData.id.toString()) {
          // Procesar reembolso
          order.status = "refunded"
          order.refundedAt = new Date().toISOString()
          order.refundReason = reason === "other" ? otherReason : reason
          order.refundedBy = "admin"

          // Añadir el monto al saldo del usuario
          user.balance = (user.balance || 0) + selectedOrderData.price

          orderFound = true
          break
        }
      }
    }
    if (orderFound) break
  }

  if (orderFound) {
    // Guardar cambios con sincronización
    saveUserData()

    // Registrar el reembolso
    const refundRecord = {
      orderId: selectedOrderData.id,
      username: selectedOrderData.username,
      amount: selectedOrderData.price,
      reason: reason === "other" ? otherReason : reason,
      processedAt: new Date().toISOString(),
      processedBy: "admin",
    }

    const refunds = JSON.parse(localStorage.getItem("jorlingRefunds")) || []
    refunds.push(refundRecord)
    localStorage.setItem("jorlingRefunds", JSON.stringify(refunds))

    // Actualizar displays
    loadUsers()
    loadStats()
    loadRecentOrders()

    // Cerrar modal y mostrar éxito
    closeModal("refundModal")
    showMessage(
      `Reembolso procesado exitosamente. $${selectedOrderData.price.toFixed(4)} añadidos al saldo de ${selectedOrderData.username}`,
      "success",
    )

    selectedOrderData = null
  } else {
    showMessage("Error: No se pudo encontrar el pedido para reembolsar", "error")
  }
}

function showQuickRecharge() {
  document.getElementById("quickRechargeModal").style.display = "block"
  loadUserSuggestions()
}

function loadUserSuggestions() {
  const searchInput = document.getElementById("quickUserSearch")
  const suggestionsDiv = document.getElementById("userSuggestions")

  const searchTerm = searchInput.value.toLowerCase()
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
            <strong>${user.username}</strong> (${user.email}) - $${(user.balance || 0).toFixed(2)}
        </div>
    `,
    )
    .join("")

  suggestionsDiv.innerHTML = suggestionsHTML
}

function selectUser(username) {
  document.getElementById("quickUserSearch").value = username
  document.getElementById("userSuggestions").innerHTML = ""
}

function setQuickAmount(amount) {
  document.getElementById("quickAmount").value = amount
}

function processQuickRecharge() {
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
  users[userIndex].balance = (users[userIndex].balance || 0) + amount
  saveUserData()

  // Update displays
  loadUsers()
  loadStats()

  // Close modal and clear form
  closeModal("quickRechargeModal")
  document.getElementById("quickRechargeForm").reset()

  showMessage(`¡Recarga exitosa! Se añadieron $${amount.toFixed(2)} a ${users[userIndex].username}`, "success")
}

function processAddBalance() {
  const amount = Number.parseFloat(document.getElementById("amountToAdd").value)
  if (amount <= 0) {
    showMessage("La cantidad debe ser mayor a 0", "error")
    return
  }

  // Find user and update balance
  const userIndex = users.findIndex((u) => u.id === selectedUserId)
  if (userIndex !== -1) {
    users[userIndex].balance = (users[userIndex].balance || 0) + amount

    // Save with sync
    saveUserData()

    // Update displays
    loadUsers()
    loadStats()

    // Close modal
    closeModal("addBalanceModal")

    showMessage(`Se añadieron $${amount.toFixed(2)} al usuario ${users[userIndex].username}`, "success")
  }
}

function viewUserDetails(userId) {
  closeModal("orderSearchModal")
  const user = users.find((u) => u.id === userId)
  if (user) {
    // Scroll to user in the table
    document.querySelector(".management-section").scrollIntoView({ behavior: "smooth" })

    // Filter to show only this user
    displayUsers([user])

    showMessage(`Mostrando detalles de ${user.username}`, "success")
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none"

  // Clear forms when closing
  if (modalId === "massAccelerationModal") {
    document.getElementById("massAccelerationForm").reset()
    document.getElementById("accelerationOtherReasonGroup").style.display = "none"
    selectedOrderData = null
  }
  if (modalId === "refundModal") {
    document.getElementById("refundForm").reset()
    document.getElementById("otherReasonGroup").style.display = "none"
    selectedOrderData = null
  }
  if (modalId === "cancelOrderModal") {
    document.getElementById("cancelOrderForm").reset()
    document.getElementById("cancelOtherReasonGroup").style.display = "none"
    selectedOrderData = null
  }
  if (modalId === "deleteAccountModal") {
    document.getElementById("deleteAccountForm").reset()
    document.getElementById("deleteOtherReasonGroup").style.display = "none"
    selectedUserId = null
  }
  if (modalId === "orderSearchModal") {
    document.getElementById("orderSearchForm").reset()
    document.getElementById("orderSearchResults").innerHTML = ""
  }
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

// Función mejorada para refrescar datos
function refreshData() {
  if (syncManager) {
    syncManager.forceSync().then(() => {
      showMessage("Datos sincronizados correctamente desde todos los dispositivos", "success")
    })
  } else {
    loadUsers()
    loadStats()
    loadRecentOrders()
    showMessage("Datos actualizados correctamente", "success")
  }
}

function exportUsers() {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    "ID,Usuario,Email,Saldo,Pedidos,Dispositivo,Fecha Registro\n" +
    users
      .map(
        (user) =>
          `${user.id},${user.username},${user.email},${(user.balance || 0).toFixed(2)},${user.orders ? user.orders.length : 0},${user.deviceType || "desktop"},${new Date(user.createdAt).toLocaleDateString()}`,
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

function logout() {
  // Limpiar intervalos
  if (syncInterval) {
    clearInterval(syncInterval)
  }

  localStorage.removeItem("adminAuth")
  window.location.href = "index.html"
}

// Actualizar window.onclick para incluir los nuevos modales
window.onclick = (event) => {
  const modals = [
    "addBalanceModal",
    "quickRechargeModal",
    "orderSearchModal",
    "refundModal",
    "cancelOrderModal",
    "deleteAccountModal",
    "massAccelerationModal",
  ]
  modals.forEach((modalId) => {
    const modal = document.getElementById(modalId)
    if (event.target === modal) {
      closeModal(modalId)
    }
  })
}

function showCancelOrderModal(orderId, username, service, price) {
  selectedOrderData = { id: orderId, username, service, price }

  document.getElementById("cancelOrderId").value = `ORD-${orderId}`
  document.getElementById("cancelUserName").value = username
  document.getElementById("cancelService").value = service
  document.getElementById("cancelAmount").value = `$${price.toFixed(4)}`

  document.getElementById("cancelOrderModal").style.display = "block"
}

function showDeleteAccountModal(userId) {
  const user = users.find((u) => u.id === userId)
  if (!user) return

  selectedUserId = userId

  document.getElementById("deleteUserName").value = user.username
  document.getElementById("deleteUserEmail").value = user.email
  document.getElementById("deleteUserBalance").value = `$${(user.balance || 0).toFixed(2)}`
  document.getElementById("deleteUserOrders").value = user.orders ? user.orders.length : 0

  document.getElementById("deleteAccountModal").style.display = "block"
}

function processCancelOrder() {
  if (!selectedOrderData) {
    showMessage("Error: No hay datos de pedido seleccionados", "error")
    return
  }

  const reason = document.getElementById("cancelReason").value
  const otherReason = document.getElementById("cancelOtherReason").value
  const shouldRefund = document.getElementById("refundOnCancel").checked

  if (!reason) {
    showMessage("Por favor selecciona un motivo para la cancelación", "error")
    return
  }

  if (reason === "other" && !otherReason.trim()) {
    showMessage("Por favor especifica el motivo de cancelación", "error")
    return
  }

  // Buscar y actualizar el pedido
  let orderFound = false
  for (const user of users) {
    if (user.orders) {
      for (const order of user.orders) {
        if (order.id.toString() === selectedOrderData.id.toString()) {
          // Cancelar pedido
          order.status = "cancelled"
          order.cancelledAt = new Date().toISOString()
          order.cancelReason = reason === "other" ? otherReason : reason
          order.cancelledBy = "admin"

          // Reembolsar si está marcado
          if (shouldRefund) {
            user.balance = (user.balance || 0) + selectedOrderData.price
            order.refunded = true
            order.refundedAt = new Date().toISOString()
          }

          orderFound = true
          break
        }
      }
    }
    if (orderFound) break
  }

  if (orderFound) {
    // Guardar cambios con sincronización
    saveUserData()

    // Registrar la cancelación
    const cancelRecord = {
      orderId: selectedOrderData.id,
      username: selectedOrderData.username,
      amount: selectedOrderData.price,
      reason: reason === "other" ? otherReason : reason,
      refunded: shouldRefund,
      processedAt: new Date().toISOString(),
      processedBy: "admin",
    }

    const cancellations = JSON.parse(localStorage.getItem("jorlingCancellations")) || []
    cancellations.push(cancelRecord)
    localStorage.setItem("jorlingCancellations", JSON.stringify(cancellations))

    // Actualizar displays
    loadUsers()
    loadStats()
    loadRecentOrders()

    // Cerrar modal y mostrar éxito
    closeModal("cancelOrderModal")
    const refundText = shouldRefund ? ` y $${selectedOrderData.price.toFixed(4)} reembolsados` : ""
    showMessage(`Pedido cancelado exitosamente${refundText}`, "success")

    selectedOrderData = null
  } else {
    showMessage("Error: No se pudo encontrar el pedido para cancelar", "error")
  }
}

function processDeleteAccount() {
  const confirmation = document.getElementById("deleteConfirmation").value
  if (confirmation !== "ELIMINAR") {
    showMessage("Debes escribir 'ELIMINAR' para confirmar la eliminación", "error")
    return
  }

  const reason = document.getElementById("deleteReason").value
  const otherReason = document.getElementById("deleteOtherReason").value
  const cancelOrders = document.getElementById("cancelAllOrders").checked
  const refundOrders = document.getElementById("refundAllOrders").checked

  if (!reason) {
    showMessage("Por favor selecciona un motivo para la eliminación", "error")
    return
  }

  if (reason === "other" && !otherReason.trim()) {
    showMessage("Por favor especifica el motivo de eliminación", "error")
    return
  }

  const userIndex = users.findIndex((u) => u.id === selectedUserId)
  if (userIndex === -1) {
    showMessage("Error: Usuario no encontrado", "error")
    return
  }

  const user = users[userIndex]
  let refundAmount = 0

  // Cancelar y reembolsar pedidos si está marcado
  if (cancelOrders && user.orders) {
    user.orders.forEach((order) => {
      if (order.status === "pending" || order.status === "processing") {
        order.status = "cancelled"
        order.cancelledAt = new Date().toISOString()
        order.cancelReason = "account_deletion"
        order.cancelledBy = "admin"

        if (refundOrders) {
          refundAmount += order.price
          order.refunded = true
          order.refundedAt = new Date().toISOString()
        }
      }
    })
  }

  // Registrar la eliminación
  const deleteRecord = {
    userId: user.id,
    username: user.username,
    email: user.email,
    balance: user.balance || 0,
    totalOrders: user.orders ? user.orders.length : 0,
    refundAmount: refundAmount,
    reason: reason === "other" ? otherReason : reason,
    deletedAt: new Date().toISOString(),
    deletedBy: "admin",
  }

  const deletions = JSON.parse(localStorage.getItem("jorlingDeletions")) || []
  deletions.push(deleteRecord)
  localStorage.setItem("jorlingDeletions", JSON.stringify(deletions))

  // Eliminar usuario
  users.splice(userIndex, 1)
  saveUserData()

  // Actualizar displays
  loadUsers()
  loadStats()
  loadRecentOrders()

  // Cerrar modal y mostrar éxito
  closeModal("deleteAccountModal")
  const refundText = refundAmount > 0 ? ` Se reembolsaron $${refundAmount.toFixed(4)} por pedidos cancelados.` : ""
  showMessage(`Cuenta de ${deleteRecord.username} eliminada permanentemente.${refundText}`, "success")

  selectedUserId = null
}

// Limpiar intervalos al cerrar la página
window.addEventListener("beforeunload", () => {
  if (syncInterval) {
    clearInterval(syncInterval)
  }
  if (syncManager) {
    syncManager.saveToAllSources()
  }
})

// Actualizar statusText para incluir cancelled
const statusText = {
  pending: "Pendiente",
  processing: "Procesando",
  completed: "Completado",
  failed: "Fallido",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
}
