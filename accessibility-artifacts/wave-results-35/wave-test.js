const puppeteer = require('puppeteer');
const fs = require('fs');

async function runWaveStyleTest() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { errors: 0, warnings: 0, passed: 0 }
  };

  const urls = [
    'http://localhost:3200/',
    'http://localhost:3200/login',
    'http://localhost:3200/register'
  ];

  for (const url of urls) {
    console.log(`Testing ${url}...`);
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // WAVE-style checks
      const pageResults = await page.evaluate(() => {
        const errors = [];
        const warnings = [];
        
        // Check for missing alt text
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          if (!img.alt && !img.getAttribute('aria-label')) {
            errors.push(`Image ${index + 1}: Missing alt text`);
          }
        });
        
        // Check for empty links
        const links = document.querySelectorAll('a');
        links.forEach((link, index) => {
          const text = link.textContent.trim();
          const ariaLabel = link.getAttribute('aria-label');
          if (!text && !ariaLabel) {
            errors.push(`Link ${index + 1}: Empty link text`);
          }
        });
        
        // Check for form labels
        const inputs = document.querySelectorAll('input[type]:not([type="hidden"])');
        inputs.forEach((input, index) => {
          const id = input.id;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledby = input.getAttribute('aria-labelledby');
          
          if (!ariaLabel && !ariaLabelledby) {
            if (!id || !document.querySelector(`label[for="${id}"]`)) {
              warnings.push(`Input ${index + 1}: Missing label`);
            }
          }
        });
        
        // Check for heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
          warnings.push('No headings found on page');
        }
        
        return { errors, warnings };
      });
      
      results.tests.push({
        url: url,
        status: pageResults.errors.length === 0 ? 'passed' : 'failed',
        errors: pageResults.errors,
        warnings: pageResults.warnings
      });
      
      results.summary.errors += pageResults.errors.length;
      results.summary.warnings += pageResults.warnings.length;
      if (pageResults.errors.length === 0) results.summary.passed++;
      
    } catch (error) {
      console.error(`Error testing ${url}:`, error.message);
      results.tests.push({
        url: url,
        status: 'error',
        errors: [`Navigation error: ${error.message}`],
        warnings: []
      });
      results.summary.errors++;
    }
    
    await page.close();
  }
  
  await browser.close();
  
  // Save results
  fs.writeFileSync('wave-results.json', JSON.stringify(results, null, 2));
  console.log('WAVE-style test completed');
  console.log(`Summary: ${results.summary.errors} errors, ${results.summary.warnings} warnings, ${results.summary.passed} passed`);
  
  return results.summary.errors;
}

runWaveStyleTest().catch(console.error);
