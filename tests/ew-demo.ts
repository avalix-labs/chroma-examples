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

  // Worker-scoped wallet context may already be connected from a previous test.
  const alreadyConnected = await page
    .getByRole('button', { name: 'Sign Message' })
    .isVisible({ timeout: 2500 })
    .catch(() => false)

  if (!alreadyConnected) {
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

    const accept = page.getByRole('button', { name: 'Accept' })
    const signMessage = page.getByRole('button', { name: 'Sign Message' })
    await Promise.race([
      accept.waitFor({ state: 'visible', timeout: 15_000 }),
      signMessage.waitFor({ state: 'visible', timeout: 15_000 }),
    ])
    if (await accept.isVisible().catch(() => false))
      await accept.click()
    await signMessage.waitFor({ state: 'visible' })
  }

  // A previous Solana setup spec may have left the demo on Solana Devnet.
  const chainButton = page.getByRole('button', { name: /Ethereum|Sepolia|Solana/i }).first()
  if (await chainButton.isVisible().catch(() => false)) {
    const label = (await chainButton.innerText()).trim()
    if (/Solana/i.test(label)) {
      await chainButton.click()
      await page.getByRole('button', { name: /Ethereum|Sepolia/i }).first().click()
      await page.getByRole('button', { name: 'Sign Typed Data' }).waitFor({ state: 'visible' })
    }
  }
}

export async function switchEwDemoToSolanaDevnet(page: Page) {
  await page.getByRole('button', { name: /Ethereum|Sepolia|Solana/i }).first().click()
  await page.getByRole('button', { name: /Solana Devnet/i }).click()
  await page.getByRole('button', { name: 'Get Balance' }).waitFor({ state: 'visible' })
}
