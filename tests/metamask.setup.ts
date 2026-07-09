import fs from 'node:fs'
import path from 'node:path'
import { createWalletTest } from '@avalix/chroma'
import { HEADLESS, SETUP_DIR } from './fixtures'

const SEED_PHRASE = 'test test test test test test test test test test test junk'
const SENTINEL = path.join(SETUP_DIR, '.chroma-onboarded')

const setup = createWalletTest({
  wallets: [{ type: 'metamask' }],
  userDataDir: SETUP_DIR,
  headless: HEADLESS,
})

setup.setTimeout(30_000 * 2)

setup('seed metamask account', async ({ wallets }) => {
  if (fs.existsSync(SENTINEL))
    return

  await wallets.metamask.importSeedPhrase({ seedPhrase: SEED_PHRASE })

  // Give Chrome time to flush MetaMask vault/IndexedDB before the context closes.
  // Without this, the next project relaunches into a fresh onboarding flow.
  await new Promise((resolve) => setTimeout(resolve, 3000))

  fs.writeFileSync(SENTINEL, '')
})
