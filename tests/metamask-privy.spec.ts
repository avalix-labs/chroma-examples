import { test } from './fixtures'

test.beforeEach(() => {
  console.log('[spec] running tests/metamask-privy.spec.ts')
})

test('should import account and connect MetaMask wallet', async ({ page, wallets }) => {
  const metamask = wallets.metamask

  await page.goto('https://demo.privy.io')
  console.log('[wallet] metamask.unlock')
  await metamask.unlock()
  await page.bringToFront()

  const alreadyConnected = await page
    .getByRole('button', { name: 'Sign out' })
    .isVisible({ timeout: 2500 })

  if (!alreadyConnected) {
    await page.getByRole('button', { name: 'Continue with a wallet' }).click()
    await page.getByPlaceholder('Search through 602 wallets').click()
    await page.getByPlaceholder('Search through 602 wallets').fill('metamask flask')
    await page.getByRole('button', { name: 'MetaMask Flask' }).click()
    await page.getByRole('button', { name: 'MetaMask Flask' }).first().click()
    console.log('[wallet] metamask.approve')
    await metamask.approve()
    await page.waitForTimeout(1000)

    await page.getByText('0x646...E85').first().waitFor({ state: 'visible' })
  }

  await page.getByRole('button', { name: 'Sign a Message' }).click()
  await page.getByRole('button', { name: 'Sign and continue' }).click()
  await page.getByRole('button', { name: 'Dismiss' }).click()
})
