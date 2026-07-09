import type { Page } from '@playwright/test'

type MetaMaskWallet = {
  approve: () => Promise<void>
  reject: () => Promise<void>
}

/**
 * MetaMask's Web3Auth connector no-ops Solana switchChain and never emits
 * CONNECTION_UPDATED, so the EW demo UI stays on Ethereum. Patch the demo
 * bundle so Solana chain switches update connector + Vue state.
 */
export async function patchEwDemoSolanaSwitch(page: Page) {
  await page.route('**/*', async (route) => {
    const url = route.request().url()
    if (!/\/assets\/index-.*\.js(\?|$)/.test(url)) {
      return route.continue()
    }

    const response = await route.fetch()
    let body = await response.text()
    body = body.replace(
      'if(r?.chainNamespace===ft.SOLANA)return;',
      'if(r?.chainNamespace===ft.SOLANA){this.currentChainNamespace=ft.SOLANA;this.updateConnectorData({chainId:t.chainId});return;}',
    )
    body = body.replace(
      'await i.switchChain(t);return}',
      'await i.switchChain(t);if(r.chainNamespace===ft.SOLANA){await this.setCurrentChain(t.chainId);this.emit(Ge.CONNECTION_UPDATED,this.connection);}return}',
    )
    await route.fulfill({
      status: response.status(),
      headers: {
        ...response.headers(),
        'content-type': 'application/javascript',
      },
      body,
    })
  })
}

export async function connectEwDemo(page: Page, metamask: MetaMaskWallet) {
  await page.goto('https://ew-demo.metamask.io/')
  await page.bringToFront()

  const closeDialog = page.getByRole('button', { name: /Close this dialog/i })
  if (await closeDialog.isVisible().catch(() => false)) {
    await closeDialog.click()
  }

  const connectButton = page.getByRole('button', { name: /MetaMask/i }).first()
  const signMessage = page.getByRole('button', { name: 'Sign Message' })

  // Worker-scoped wallet context may already be connected from a previous test.
  await Promise.race([
    signMessage.waitFor({ state: 'visible', timeout: 15_000 }),
    connectButton.waitFor({ state: 'visible', timeout: 15_000 }),
  ])
  if (await signMessage.isVisible().catch(() => false))
    return

  // MetaMask → connect → ownership signature → accept terms
  await connectButton.click()
  await metamask.approve()

  const accept = page.getByRole('button', { name: 'Accept' })
  const connected = Promise.race([
    accept.waitFor({ state: 'visible', timeout: 30_000 }),
    signMessage.waitFor({ state: 'visible', timeout: 30_000 }),
  ])

  // The ownership signature may already be covered by the first approve, so stop
  // waiting on a second prompt as soon as the demo moves past the wallet.
  await Promise.race([metamask.approve().catch(() => {}), connected])
  await connected

  if (await accept.isVisible().catch(() => false))
    await accept.click()
  await signMessage.waitFor({ state: 'visible' })
}

function ewDemoChainButton(page: Page) {
  return page.getByRole('button', { name: /Ethereum|Sepolia|Solana/i }).first()
}

export async function switchEwDemoToSolanaDevnet(page: Page) {
  await ewDemoChainButton(page).click()
  await page.getByRole('button', { name: /Solana Devnet/i }).click()
  await page.getByRole('button', { name: 'Get Balance' }).waitFor({ state: 'visible' })
}

/** No-op unless a prior spec sharing this worker context left the demo on Solana. */
export async function switchEwDemoToEthereum(page: Page) {
  const chainButton = ewDemoChainButton(page)
  await chainButton.waitFor({ state: 'visible' })
  if (!/Solana/i.test((await chainButton.innerText()).trim()))
    return

  await chainButton.click()
  await page.getByRole('button', { name: /Ethereum|Sepolia/i }).first().click()
  await page.getByRole('button', { name: 'Sign Typed Data' }).waitFor({ state: 'visible' })
}
