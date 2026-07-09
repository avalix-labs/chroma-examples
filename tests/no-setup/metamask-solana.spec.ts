import { createWalletTest } from '@avalix/chroma'
import { connectPrivyDemo } from '../privy'

const SEED_PHRASE = 'test test test test test test test test test test test junk'

const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
})

test.beforeEach(() => {
  console.log('[spec] running tests/no-setup/metamask-solana.spec.ts')
})

test.beforeAll(async ({ wallets }) => {
  console.log('[wallet] metamask.importSeedPhrase')
  await wallets.metamask.importSeedPhrase({ seedPhrase: SEED_PHRASE })
})

test('should connect Solana account on Privy demo', async ({ page, wallets }) => {
  const metamask = wallets.metamask

  console.log('[page] visit https://demo.privy.io')
  await connectPrivyDemo(page, metamask, { accountIndex: 1 })

  await page.getByRole('button', { name: 'Sign a Message' }).click()
  await page.getByRole('button', { name: 'Sign and continue' }).click()
  await page.getByRole('button', { name: 'Dismiss' }).click()
})
