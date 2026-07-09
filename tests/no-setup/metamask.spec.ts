import { createWalletTest } from '@avalix/chroma'
import { connectPrivyDemo } from '../privy'

const SEED_PHRASE = 'test test test test test test test test test test test junk'

const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
})

test.beforeEach(() => {
  console.log('[spec] running tests/no-setup/metamask.spec.ts')
})

test.beforeAll(async ({ wallets }) => {
  console.log('[wallet] metamask.importSeedPhrase')
  await wallets.metamask.importSeedPhrase({ seedPhrase: SEED_PHRASE })
})

test('should import account and connect MetaMask wallet', async ({ page, wallets }) => {
  const metamask = wallets.metamask

  console.log('[page] visit https://demo.privy.io')
  await connectPrivyDemo(page, metamask)

  await page.getByText('0x646...E85').first().waitFor({ state: 'visible' })

  await page.getByRole('button', { name: 'Sign a Message' }).click()
  await page.getByRole('button', { name: 'Sign and continue' }).click()
  await page.getByRole('button', { name: 'Dismiss' }).click()
})
