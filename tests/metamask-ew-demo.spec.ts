import { test } from './fixtures'

test.beforeEach(() => {
  console.log('[spec] running tests/metamask-ew-demo.spec.ts')
})

test.skip('should sign message and typed data and reject send transaction on EW demo', async ({
  page,
  wallets,
}) => {
  const metamask = wallets.metamask

  await page.goto('https://ew-demo.metamask.io/')
  console.log('[wallet] metamask.unlock')
  await metamask.unlock()
  await page.bringToFront()

  const walletAlreadySelected = await page
    .getByRole('button', { name: '0xf39fd6e5....b92266' })
    .isVisible({ timeout: 2500 })

  if (!walletAlreadySelected) {
    await page.getByRole('button', { name: 'MetaMask Installed arrow' }).click()
    await page.getByRole('button', { name: 'chain-evm EVM arrow' }).click()

    console.log('[wallet] metamask.approve')
    await metamask.approve()
  }

  await page.getByRole('button', { name: 'Sign Message' }).click()
  console.log('[wallet] metamask.approve')
  await metamask.approve()
  await page.getByText('Signature:').first().waitFor({ state: 'visible' })
  await page.waitForTimeout(1000)

  await page.getByRole('button', { name: 'Sign Typed Data' }).click()
  console.log('[wallet] metamask.approve')
  await metamask.approve()
  await page.getByText('Signature:').nth(1).waitFor({ state: 'visible' })
  await page.waitForTimeout(1000)

  await page.getByRole('button', { name: 'Send Transaction' }).click()
  console.log('[wallet] metamask.reject')
  await metamask.reject()
  await page.locator('span').filter({ hasText: 'User rejected the request.' }).waitFor({ state: 'visible' })
})
