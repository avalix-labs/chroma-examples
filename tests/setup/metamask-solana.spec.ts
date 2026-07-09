import {
  connectEwDemo,
  patchEwDemoSolanaSwitch,
  switchEwDemoToSolanaDevnet,
} from '../ew-demo'
import { test } from '../fixtures'
import { connectPrivyDemo } from '../privy'

test.beforeEach(() => {
  console.log('[spec] running tests/setup/metamask-solana.spec.ts')
})

test('should connect Solana account on Privy demo', async ({ page, wallets }) => {
  test.setTimeout(90_000)
  const metamask = wallets.metamask

  console.log('[wallet] metamask.unlock')
  await metamask.unlock()

  console.log('[page] visit https://demo.privy.io')
  await connectPrivyDemo(page, metamask, { accountIndex: 1 })

  await page.getByRole('button', { name: 'Sign a Message' }).click()
  await page.getByRole('button', { name: 'Sign and continue' }).click()
  await page.getByRole('button', { name: 'Dismiss' }).click()
})

test('should sign and reject Solana transactions on EW demo', async ({ page, wallets }) => {
  test.setTimeout(120_000)
  const metamask = wallets.metamask

  console.log('[wallet] metamask.unlock')
  await metamask.unlock()
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
