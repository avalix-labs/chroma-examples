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

  await page.getByRole('button', { name: 'Sign a Message' }).click()
  await page.getByRole('button', { name: 'Sign and continue' }).click()
  await page.getByRole('button', { name: 'Dismiss' }).click()
})

test('should sign message and typed data and reject send transaction on EW demo', async ({ page, wallets }) => {
  const metamask = wallets.metamask

  await page.goto('https://ew-demo.metamask.io/')
  await page.getByRole('button', { name: 'Metamask Flask Installed arrow' }).click()
  await page.getByRole('button', { name: 'chain-evm EVM arrow' }).click()

  await metamask.authorize()

  await page.getByRole('button', { name: 'Sign Message' }).click()
  await metamask.confirm()
  await page.getByText('Signature:').first().waitFor({ state: 'visible' })
  await page.waitForTimeout(1000)

  await page.getByRole('button', { name: 'Sign Typed Data' }).click()
  await metamask.confirm()
  await page.getByText('Signature:').nth(1).waitFor({ state: 'visible' })
  await page.waitForTimeout(1000)

  await page.getByRole('button', { name: 'Send Transaction' }).click()
  await metamask.reject()
  await page.locator('span').filter({ hasText: 'User rejected the request.' }).waitFor({ state: 'visible' })
})
