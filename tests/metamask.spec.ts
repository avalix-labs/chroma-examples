import { createWalletTest } from '@avalix/chroma'

const SEED_PHRASE = 'test test test test test test test test test test test junk'

const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
})

test.setTimeout(30_000 * 2)

test.beforeAll(async ({ wallets }) => {
  const metamask = wallets.metamask
  await metamask.importSeedPhrase({ seedPhrase: SEED_PHRASE })
})

test('should import account and connect MetaMask wallet', async ({ page, wallets }) => {
  const metamask = wallets.metamask

  await page.goto('https://demo.privy.io')
  await page.waitForLoadState('domcontentloaded')
  await page.bringToFront()

  await page.getByRole('button', { name: 'Continue with a wallet' }).click()
  await page.getByPlaceholder('Search through 602 wallets').click()
  await page.getByPlaceholder('Search through 602 wallets').fill('metamask flask')
  await page.getByRole('button', { name: 'MetaMask Flask' }).click()
  await page.getByRole('button', { name: 'MetaMask Flask' }).first().click()
  await metamask.authorize()
  await metamask.confirm()

  await page.getByText('0x646...E85').first().waitFor({ state: 'visible' })
})