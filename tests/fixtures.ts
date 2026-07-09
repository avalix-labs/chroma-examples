import type { BrowserContext } from '@playwright/test'
import { createWalletTest } from '@avalix/chroma'

export const SETUP_DIR = '.cache/wallet-setup'

/**
 * Chroma defaults to headed. MetaMask side-panel flows need a real display
 * (local window or CI Xvfb). Set HEADLESS=1 to try headless locally.
 */
export const HEADLESS = process.env.HEADLESS === '1'

const METAMASK_EXT_ID = 'ballfkogangmmgjnbokcnmkcjljoopkm'
const METAMASK_PASSWORD = 'h3llop0lkadot!'

export const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
  userDataDir: SETUP_DIR,
  headless: HEADLESS,
})

/**
 * Unlock a prepared MetaMask profile and leave a sidepanel page open.
 *
 * MetaMask 13.x shows a passkey setup screen after unlock on a reused profile.
 * Chroma's unlock() does not dismiss that screen, so later approve() calls fail
 * to find a usable side panel. This helper waits for the unlock route, skips
 * passkey/completion, then opens sidepanel.html as a regular page (which CDP
 * still exposes for Chroma's approve/reject helpers).
 */
export async function unlockPreparedMetamask(walletContext: BrowserContext) {
  const extensionUrlPrefix = `chrome-extension://${METAMASK_EXT_ID}/`
  const sidePanelUrl = `${extensionUrlPrefix}sidepanel.html`

  // Already unlocked with a side panel open (worker-scoped context reuse).
  const existingSidePanel = walletContext.pages().find((p) =>
    p.url().startsWith(sidePanelUrl) && !p.url().includes('onboarding') && !p.url().includes('unlock'),
  )
  if (existingSidePanel)
    return

  let unlockPage
  const deadline = Date.now() + 20_000
  while (Date.now() < deadline) {
    unlockPage = walletContext.pages().find((p) => p.url().includes('unlock'))
    if (unlockPage)
      break
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  if (!unlockPage) {
    // Profile may already be unlocked without a side panel page.
    const sidePanel = await walletContext.newPage()
    await sidePanel.goto(sidePanelUrl)
    await sidePanel.waitForLoadState('domcontentloaded')
    return
  }

  await unlockPage.bringToFront()
  await unlockPage.waitForLoadState('domcontentloaded')
  await unlockPage.getByTestId('unlock-password').fill(METAMASK_PASSWORD)
  await unlockPage.getByTestId('unlock-submit').click()

  // MetaMask 13.x post-unlock onboarding on a prepared profile.
  await unlockPage.getByTestId('passkey-maybe-later-button').click({ timeout: 5_000 }).catch(() => {})
  await unlockPage.getByTestId('onboarding-complete-done').click({ timeout: 5_000 }).catch(() => {})

  await unlockPage.goto(sidePanelUrl)
  await unlockPage.waitForLoadState('domcontentloaded')
}

export { expect } from '@playwright/test'
