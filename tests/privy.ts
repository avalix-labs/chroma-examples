import type { Page } from '@playwright/test'

type MetaMaskWallet = {
  approve: () => Promise<void>
}

/**
 * Connect the MetaMask extension to the Privy demo.
 *
 * Privy's wallet picker lists one MetaMask entry per chain namespace:
 * `accountIndex` 0 is the EVM account, 1 is the Solana account.
 */
export async function connectPrivyDemo(
  page: Page,
  metamask: MetaMaskWallet,
  { accountIndex = 0 }: { accountIndex?: number } = {},
) {
  await page.goto('https://demo.privy.io')
  await page.bringToFront()

  const rejectAll = page.getByRole('button', { name: 'REJECT ALL' })
  if (await rejectAll.isVisible().catch(() => false)) {
    await rejectAll.click()
    await rejectAll.waitFor({ state: 'hidden' })
  }

  const continueWithWallet = page.getByRole('button', { name: 'Continue with a wallet' })
  const signOut = page.getByRole('button', { name: 'Sign out' })

  // Worker-scoped wallet context may already be signed in from a previous spec.
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
  await page.getByRole('button', { name: 'MetaMask' }).nth(accountIndex).click()

  console.log('[wallet] metamask.approve')
  await metamask.approve()
  await page.waitForTimeout(1000)

  try {
    await metamask.approve()
  }
  catch {
    console.log('no approve needed')
  }
}
