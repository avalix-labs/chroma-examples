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

  // MetaMask → connect → ownership signature → accept terms
  await page.getByRole('button', { name: /MetaMask/i }).first().click()
  await metamask.approve()
  try {
    await Promise.race([
      metamask.approve(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('no second approve')), 10_000)),
    ])
  } catch {
    // Ownership signature may already be handled by the first approve.
  }
  await page.getByRole('button', { name: 'Accept' }).click()
  await page.getByRole('button', { name: 'Sign Message' }).waitFor({ state: 'visible' })
}

export async function switchEwDemoToSolanaDevnet(page: Page) {
  await page.getByRole('button', { name: /Ethereum|Sepolia|Solana/i }).first().click()
  await page.getByRole('button', { name: /Solana Devnet/i }).click()
  await page.getByRole('button', { name: 'Get Balance' }).waitFor({ state: 'visible' })
}
