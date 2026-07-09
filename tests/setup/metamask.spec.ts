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
