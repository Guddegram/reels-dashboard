const DASHBOARD_URL = 'http://localhost:3000'

document.getElementById('openBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: DASHBOARD_URL })
})

document.getElementById('saveBtn').addEventListener('click', async () => {
  const status = document.getElementById('status')
  const btn = document.getElementById('saveBtn')

  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const url = tab.url

  if (!url || !url.includes('instagram.com')) {
    status.textContent = '⚠️ Kein Instagram Reel geöffnet'
    status.style.color = '#f59e0b'
    return
  }

  if (!url.includes('/reel/') && !url.includes('/p/')) {
    status.textContent = '⚠️ Bitte einen Reel öffnen'
    status.style.color = '#f59e0b'
    return
  }

  btn.textContent = '⏳ Wird gespeichert...'
  btn.disabled = true

  try {
    const res = await fetch(`${DASHBOARD_URL}/api/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url }),
    })

    const data = await res.json()

    if (res.ok) {
      btn.textContent = data.imported > 0 ? '✅ Gespeichert!' : '✅ Bereits vorhanden'
      status.textContent = 'Im Dashboard verfügbar'
      status.style.color = '#10b981'
    } else if (res.status === 401) {
      status.textContent = '⚠️ Bitte erst im Dashboard einloggen'
      status.style.color = '#f59e0b'
      btn.textContent = '💾 Diesen Reel speichern'
      btn.disabled = false
    } else {
      throw new Error(data.error)
    }
  } catch (e) {
    status.textContent = '❌ Fehler: ' + e.message
    status.style.color = '#ef4444'
    btn.textContent = '💾 Diesen Reel speichern'
    btn.disabled = false
  }
})
