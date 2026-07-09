#!/usr/bin/env node
import { createRequire } from 'node:module'
import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const chromaRoot = path.dirname(require.resolve('@avalix/chroma/package.json'))
const AdmZip = require(require.resolve('adm-zip', { paths: [chromaRoot] }))

async function resolveMetaMaskConfig() {
  const distDir = path.join(chromaRoot, 'dist')
  const files = await fs.readdir(distDir)

  for (const file of files) {
    if (!file.endsWith('.mjs') || file === 'index.mjs' || file === 'download-extensions.mjs') {
      continue
    }

    const mod = await import(pathToFileURL(path.join(distDir, file)).href)
    const config = mod.METAMASK_CONFIG ?? mod.m
    if (config?.extensionName?.startsWith('metamask-') && config?.downloadUrl) {
      return config
    }
  }

  throw new Error('Could not resolve METAMASK_CONFIG from @avalix/chroma')
}

async function moveExtractedToFinal(sourceDir, destDir) {
  const entries = await fs.readdir(sourceDir)
  if (entries.length === 1) {
    const singleEntry = path.join(sourceDir, entries[0])
    if ((await fs.stat(singleEntry)).isDirectory()) {
      await fs.rename(singleEntry, destDir)
      await fs.rm(sourceDir, { recursive: true, force: true })
      return
    }
  }
  await fs.rename(sourceDir, destDir)
}

async function downloadMetaMask({ downloadUrl, extensionName }) {
  const extensionsDir = path.resolve(process.cwd(), '.chroma')
  const extensionDir = path.join(extensionsDir, extensionName)
  const zipPath = path.join(extensionsDir, `${extensionName}.zip`)
  const tempExtractDir = path.join(extensionsDir, `${extensionName}-temp`)

  console.log('🗑️ Clearing existing .chroma directory...')
  await fs.rm(extensionsDir, { recursive: true, force: true })
  await fs.mkdir(extensionsDir, { recursive: true })

  console.log(`\n📥 Downloading ${extensionName}...`)
  const response = await fetch(downloadUrl, { signal: AbortSignal.timeout(3e5) })
  if (!response.ok) {
    throw new Error(`Failed to download extension: ${response.status} ${response.statusText}`)
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(zipPath))

  console.log('📦 Extracting extension...')
  await fs.mkdir(tempExtractDir, { recursive: true })
  new AdmZip(zipPath).extractAllTo(tempExtractDir, true)
  await moveExtractedToFinal(tempExtractDir, extensionDir)
  await fs.unlink(zipPath)

  console.log(`✅ ${extensionName} downloaded and extracted to: ${extensionDir}`)
}

async function main() {
  const version = JSON.parse(await fs.readFile(path.join(chromaRoot, 'package.json'), 'utf8')).version
  console.log(`\n🎨 Chroma v${version}`)
  console.log('🚀 Downloading MetaMask extension only...')

  const config = await resolveMetaMaskConfig()
  await downloadMetaMask(config)

  console.log('\n✅ MetaMask extension downloaded successfully!')
  console.log('You can now run your Playwright tests.')
}

main().catch((error) => {
  console.error('\n❌ Failed to download MetaMask:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
