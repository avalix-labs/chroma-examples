import type { BrowserContext } from '@playwright/test'
import { createWalletTest } from '@avalix/chroma'

export const SETUP_DIR = '.cache/wallet-setup'

/**
 * Chroma defaults to headed. MetaMask side-panel flows need a real display
 * (local window or CI Xvfb). Set HEADLESS=1 to try headless locally.
 */
export const HEADLESS = process.env.HEADLESS === '1'

export const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
  userDataDir: SETUP_DIR,
  headless: HEADLESS,
})

type MetaMaskWallet = {
  unlock: () => Promise<void>
  extensionId: string
}

/**
 * Unlock a prepared profile with Chroma's unlock(), then leave a sidepanel
 * page open so approve/reject can attach without racing CDP targets.
 *
 * Chroma PR #132 hardens unlock itself; approve still expects a usable
 * sidepanel page after the unlock tab is closed.
 */
export async function unlockPreparedMetamask(
  wallets: { metamask: MetaMaskWallet },
  walletContext: BrowserContext,
) {
  await wallets.metamask.unlock()

  // Let MetaMask settle after unlock closes the unlock tab.
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const sidePanelUrl = `chrome-extension://${wallets.metamask.extensionId}/sidepanel.html`
  const existing = walletContext.pages().find((p) => {
    try {
      return !p.isClosed() && p.url().startsWith(sidePanelUrl)
    }
    catch {
      return false
    }
  })
  if (existing)
    return

  const sidePanel = await walletContext.newPage()
  await sidePanel.goto(sidePanelUrl, { waitUntil: 'domcontentloaded' })
  await sidePanel.getByTestId('account-menu-icon').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {})
}

export { expect } from '@playwright/test'
