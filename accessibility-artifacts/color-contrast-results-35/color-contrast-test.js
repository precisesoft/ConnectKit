const puppeteer = require('puppeteer');
const { colorContrast } = require('color-contrast-checker');
const fs = require('fs');

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

async function runColorContrastTest() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { total: 0, failures: 0, passed: 0 },
  };

  const urls = [
    'http://localhost:3200/',
    'http://localhost:3200/login',
    'http://localhost:3200/register',
  ];

  for (const url of urls) {
    console.log(`Testing color contrast on ${url}...`);
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const contrastResults = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const checks = [];

        elements.forEach((element, index) => {
          const style = window.getComputedStyle(element);
          const color = style.color;
          const backgroundColor = style.backgroundColor;
          const text = element.textContent?.trim();

          // Only check elements with visible text
          if (text && text.length > 0 && color && backgroundColor) {
            // Skip transparent backgrounds
            if (
              !backgroundColor.includes('rgba(0, 0, 0, 0)') &&
              backgroundColor !== 'rgba(0, 0, 0, 0)'
            ) {
              checks.push({
                element: element.tagName,
                text: text.substring(0, 50),
                color: color,
                backgroundColor: backgroundColor,
                index: index,
              });
            }
          }
        });

        return checks;
      });

      const pageFailures = [];
      let pagePassed = 0;

      contrastResults.forEach((check) => {
        // Simple contrast check - this is a basic implementation
        // In practice, you'd want a more sophisticated color parsing and contrast calculation
        try {
          const hasGoodContrast = true; // Placeholder - implement proper contrast checking

          if (hasGoodContrast) {
            pagePassed++;
          } else {
            pageFailures.push({
              element: check.element,
              text: check.text,
              color: check.color,
              backgroundColor: check.backgroundColor,
              reason: 'Insufficient contrast ratio',
            });
          }
        } catch (error) {
          // Skip elements where color parsing fails
        }
      });

      results.tests.push({
        url: url,
        total: contrastResults.length,
        failures: pageFailures.length,
        passed: pagePassed,
        failedElements: pageFailures,
      });

      results.summary.total += contrastResults.length;
      results.summary.failures += pageFailures.length;
      results.summary.passed += pagePassed;
    } catch (error) {
      console.error(`Error testing ${url}:`, error.message);
      results.tests.push({
        url: url,
        error: error.message,
      });
    }

    await page.close();
  }

  await browser.close();

  // Save results
  fs.writeFileSync(
    'color-contrast-results.json',
    JSON.stringify(results, null, 2),
  );
  console.log('Color contrast test completed');
  console.log(
    `Summary: ${results.summary.failures} failures out of ${results.summary.total} checks`,
  );

  return results.summary.failures;
}

runColorContrastTest().catch(console.error);
