// Reels Dashboard - Content Script
// Läuft auf instagram.com und fügt "Speichern" Buttons hinzu

const DASHBOARD_URL = 'http://localhost:3000' // Ändern wenn deployed

let lastUrl = location.href
let buttonInjected = false

function getCurrentReelUrl() {
  // Try to get the current reel URL from the page
  const url = window.location.href
  if (url.includes('/reel/') || url.includes('/p/')) {
    // Clean up the URL
    const match = url.match(/(https:\/\/www\.instagram\.com\/(?:reel|p)\/[A-Za-z0-9_-]+\/)/)
    return match ? match[1] : url
  }
  return null
}

function createSaveButton(reelUrl) {
  const btn = document.createElement('button')
  btn.className = 'reels-dashboard-btn'
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
    Zum Dashboard
  `
  btn.title = 'In Reels Dashboard speichern'

  btn.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
      Speichern...
    `
    btn.disabled = true

    try {
      const res = await fetch(`${DASHBOARD_URL}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: reelUrl }),
      })

      if (res.ok) {
        const data = await res.json()
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          ${data.imported > 0 ? 'Gespeichert!' : 'Bereits vorhanden'}
        `
        btn.style.background = data.imported > 0 ? '#10b981' : '#6b7280'
        setTimeout(() => {
          btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Zum Dashboard
          `
          btn.style.background = ''
          btn.disabled = false
        }, 2000)
      } else if (res.status === 401) {
        // Not logged in — open dashboard
        window.open(`${DASHBOARD_URL}/login`, '_blank')
        btn.disabled = false
        btn.innerHTML = `Zum Dashboard`
      } else {
        throw new Error('Fehler')
      }
    } catch {
      btn.innerHTML = `Fehler — Retry`
      btn.disabled = false
    }
  })

  return btn
}

function injectButton() {
  const url = getCurrentReelUrl()
  if (!url) return

  // Avoid duplicate buttons
  if (document.querySelector('.reels-dashboard-btn')) return

  // Find a good place to inject — near the action buttons on reels
  const selectors = [
    'section._ae5q', // Reel action buttons area
    'div._ae5m',
    '[role="main"] section',
  ]

  let target = null
  for (const sel of selectors) {
    target = document.querySelector(sel)
    if (target) break
  }

  if (!target) {
    // Fallback: add floating button
    const container = document.createElement('div')
    container.className = 'reels-dashboard-float'
    container.appendChild(createSaveButton(url))
    document.body.appendChild(container)
    return
  }

  target.appendChild(createSaveButton(url))
}

// Watch for URL changes (Instagram is a SPA)
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    buttonInjected = false
    setTimeout(injectButton, 1000)
  }
})

observer.observe(document.body, { subtree: true, childList: true })

// Initial injection
setTimeout(injectButton, 1500)
