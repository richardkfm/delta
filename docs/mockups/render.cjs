// Renders the mockup pages in this folder to PNG. See README.md for usage.
const path = require('node:path')
const { chromium } = require('playwright')

const PAGES = ['gezeiten', 'kompass', 'morgenzeitung']

;(async () => {
  const browser = await chromium.launch()
  for (const name of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 })
    await page.goto(`file://${path.join(__dirname, `${name}.html`)}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500) // let the widget's number animations finish
    const height = await page.evaluate(() => document.querySelector('.browser').scrollHeight)
    await page.screenshot({
      path: path.join(__dirname, `${name}.png`),
      clip: { x: 0, y: 0, width: 1440, height: Math.min(height, 1000) },
    })
    console.log(`${name}.png`)
  }
  await browser.close()
})()
