import {
  connectEwDemo,
  patchEwDemoSolanaSwitch,
  switchEwDemoToSolanaDevnet,
} from '../ew-demo'
import { test, unlockPreparedMetamask } from '../fixtures'

test.beforeEach(() => {
  console.log('[spec] running tests/setup/metamask-solana.spec.ts')
})

test('should connect Solana account on Privy demo', async ({ page, wallets, walletContext }) => {
  test.setTimeout(90_000)
  const metamask = wallets.metamask

  console.log('[wallet] unlock prepared metamask')
  await unlockPreparedMetamask(walletContext)

  console.log('[page] visit https://demo.privy.io')
  await page.goto('https://demo.privy.io')
  await page.bringToFront()

  const rejectAll = page.getByRole('button', { name: 'REJECT ALL' })
  if (await rejectAll.isVisible().catch(() => false)) {
    await rejectAll.click()
    await page.waitForTimeout(2000)
  }

  const continueWithWallet = page.getByRole('button', { name: 'Continue with a wallet' })
  const signOut = page.getByRole('button', { name: 'Sign out' })

  // Shared worker context may already be signed into Privy from a previous setup spec.
  await Promise.race([
    continueWithWallet.waitFor({ state: 'visible', timeout: 15_000 }),
    signOut.waitFor({ state: 'visible', timeout: 15_000 }),
  ])

  if (await signOut.isVisible().catch(() => false)) {
    await signOut.click()
    await continueWithWallet.waitFor({ state: 'visible', timeout: 15_000 })
  }

  await continueWithWallet.click()
  // Privy shows the wallet count in the placeholder ("Search through 602
  // wallets"); match loosely so the test survives count changes.
  const search = page.getByPlaceholder(/Search.*wallets?/i)
  await search.click()
  await search.fill('metamask')
  await page.getByRole('button', { name: 'MetaMask' }).click()
  await page.getByRole('button', { name: 'MetaMask' }).nth(1).click()

  console.log('[wallet] metamask.approve')
  await metamask.approve()
  await page.waitForTimeout(1000)

  try {
    await metamask.approve()
  }
  catch {
    console.log('no approve needed')
  }

  await page.getByRole('button', { name: 'Sign a Message' }).click()
  await page.getByRole('button', { name: 'Sign and continue' }).click()
  await page.getByRole('button', { name: 'Dismiss' }).click()
})

test('should sign and reject Solana transactions on EW demo', async ({ page, wallets, walletContext }) => {
  test.setTimeout(120_000)
  const metamask = wallets.metamask

  console.log('[wallet] unlock prepared metamask')
  await unlockPreparedMetamask(walletContext)
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
