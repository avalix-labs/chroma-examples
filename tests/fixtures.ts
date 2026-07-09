import { createWalletTest } from '@avalix/chroma'

export const SETUP_DIR = '.cache/wallet-setup'

export const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
  userDataDir: SETUP_DIR,
})

export { expect } from '@playwright/test'
