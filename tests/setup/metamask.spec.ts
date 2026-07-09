import { connectEwDemo, switchEwDemoToEthereum } from '../ew-demo'
import { test } from '../fixtures'
import { connectPrivyDemo } from '../privy'

test.beforeEach(() => {
  console.log('[spec] running tests/setup/metamask.spec.ts')
})

test('should import account and connect MetaMask wallet', async ({ page, wallets }) => {
  test.setTimeout(90_000)
  const metamask = wallets.metamask

  console.log('[wallet] metamask.unlock')
  await metamask.unlock()

  console.log('[page] visit https://demo.privy.io')
  await connectPrivyDemo(page, metamask)

  await page.getByText('0x646...E85').first().waitFor({ state: 'visible' })

  await page.getByRole('button', { name: 'Sign a Message' }).click()
  await page.getByRole('button', { name: 'Sign and continue' }).click()
  await page.getByRole('button', { name: 'Dismiss' }).click()
})

test('should sign message and typed data and reject send transaction on EW demo', async ({ page, wallets }) => {
  test.setTimeout(120_000)
  const metamask = wallets.metamask

  console.log('[wallet] metamask.unlock')
  await metamask.unlock()
  console.log('[page] visit https://ew-demo.metamask.io/')
  await connectEwDemo(page, metamask)
  await switchEwDemoToEthereum(page)

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
