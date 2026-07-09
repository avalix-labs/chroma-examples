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

export { expect } from '@playwright/test'
