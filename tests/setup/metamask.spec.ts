import { connectEwDemo } from '../ew-demo'
import { test, unlockPreparedMetamask } from '../fixtures'

test.beforeEach(() => {
  console.log('[spec] running tests/setup/metamask.spec.ts')
})

test('should import account and connect MetaMask wallet', async ({ page, wallets, walletContext }) => {
  test.setTimeout(90_000)
  const metamask = wallets.metamask

  console.log('[wallet] metamask.unlock')
  await unlockPreparedMetamask(wallets, walletContext)

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

  const search = page.getByPlaceholder(/Search.*wallets?/i)
  await continueWithWallet.click()
  await search.click()
  await search.fill('metamask')
  await page.getByRole('button', { name: 'MetaMask' }).click()
  await page.getByRole('button', { name: 'MetaMask' }).first().click()
  console.log('[wallet] metamask.approve')
  await metamask.approve()
  await page.waitForTimeout(1000)

  try {
    await metamask.approve()
  }
  catch {
    console.log('no approve needed')
  }

  await page.getByText('0x646...E85').first().waitFor({ state: 'visible' })

  await page.getByRole('button', { name: 'Sign a Message' }).click()
  await page.getByRole('button', { name: 'Sign and continue' }).click()
  await page.getByRole('button', { name: 'Dismiss' }).click()
})

test('should sign message and typed data and reject send transaction on EW demo', async ({ page, wallets, walletContext }) => {
  test.setTimeout(120_000)
  const metamask = wallets.metamask

  console.log('[wallet] metamask.unlock')
  await unlockPreparedMetamask(wallets, walletContext)
  console.log('[page] visit https://ew-demo.metamask.io/')
  await connectEwDemo(page, metamask)

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
