import { createWalletTest } from '@avalix/chroma'
import {
  connectEwDemo,
  patchEwDemoSolanaSwitch,
  switchEwDemoToSolanaDevnet,
} from '../ew-demo'
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

test('should sign and reject Solana transactions on EW demo', async ({ page, wallets }) => {
  test.setTimeout(120_000)
  const metamask = wallets.metamask

  console.log('[page] visit https://ew-demo.metamask.io/')
  await patchEwDemoSolanaSwitch(page)
  await connectEwDemo(page, metamask)
  await switchEwDemoToSolanaDevnet(page)

  await page.getByRole('button', { name: 'Sign Message' }).click()
  console.log('[wallet] metamask.approve')
  await metamask.approve()
  await page.getByText('Signature:').first().waitFor({ state: 'visible' })
  await page.waitForTimeout(1000)

  await page.getByRole('button', { name: 'Get Balance' }).click()
  await page.getByRole('button', { name: 'Sign & Send Tx' }).click()
  console.log('[wallet] metamask.reject')
  await metamask.reject()
  await page.locator('span').filter({ hasText: 'User rejected the request.' }).waitFor({ state: 'visible' })
})
