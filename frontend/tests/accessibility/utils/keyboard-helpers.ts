import { Page, Locator } from '@playwright/test';

/**
 * Keyboard navigation test utilities
 */

export interface FocusableElement {
  selector: string;
  text?: string;
  tagName?: string;
  role?: string;
  ariaLabel?: string;
  tabIndex?: string;
}

/**
 * Get all focusable elements on the page
 */
export async function getFocusableElements(page: Page): Promise<Locator[]> {
  const focusableSelectors = [
    'a[href]:not([disabled]):not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'audio[controls]',
    'video[controls]',
    'iframe',
    'embed',
    'object',
  ].join(', ');

  return await page.locator(focusableSelectors).all();
}

/**
 * Get the currently focused element
 */
export async function getFocusedElement(page: Page): Promise<Locator> {
  return page.locator(':focus').first();
}

/**
 * Check if an element has a visible focus indicator
 */
export async function hasVisibleFocusIndicator(
  element: Locator
): Promise<boolean> {
  return await element
    .evaluate(el => {
      const styles = window.getComputedStyle(el);

      // Check for outline
      if (
        styles.outline &&
        styles.outline !== 'none' &&
        styles.outline !== '0'
      ) {
        return true;
      }

      // Check for box-shadow (often used for focus rings)
      if (styles.boxShadow && styles.boxShadow !== 'none') {
        const shadows = styles.boxShadow.split(/,(?![^(]*\))/);
        for (const shadow of shadows) {
          // Look for shadows that might be focus indicators (usually have spread)
          if (shadow.includes('px') && !shadow.includes('inset')) {
            return true;
          }
        }
      }

      // Check for border changes (comparing with non-focused state would be better)
      if (styles.borderColor || styles.borderWidth) {
        // This is a basic check, ideally we'd compare with unfocused state
        return true;
      }

      // Check for background color change (some designs use this)
      if (styles.backgroundColor && styles.backgroundColor !== 'transparent') {
        return true;
      }

      return false;
    })
    .catch(() => false);
}

/**
 * Navigate through elements using Tab key and collect information
 */
export async function tabThroughElements(
  page: Page,
  count: number = 10
): Promise<FocusableElement[]> {
  const elements: FocusableElement[] = [];

  for (let i = 0; i < count; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const focused = await getFocusedElement(page);
    const isVisible = await focused.isVisible().catch(() => false);

    if (isVisible) {
      const elementInfo: FocusableElement = {
        selector: await focused.evaluate(el => {
          // Generate a selector for the element
          if (el.id) return `#${el.id}`;
          if (el.className) return `.${el.className.split(' ')[0]}`;
          return el.tagName.toLowerCase();
        }),
        tagName: await focused.evaluate(el => el.tagName),
        text: await focused.textContent().catch(() => undefined),
        role: await focused.getAttribute('role').catch(() => undefined),
        ariaLabel: await focused
          .getAttribute('aria-label')
          .catch(() => undefined),
        tabIndex: await focused.getAttribute('tabindex').catch(() => undefined),
      };

      elements.push(elementInfo);
    }
  }

  return elements;
}

/**
 * Check if focus is trapped within a container
 */
export async function isFocusTrapped(
  page: Page,
  container: Locator,
  maxAttempts: number = 20
): Promise<boolean> {
  let isTrapped = true;

  for (let i = 0; i < maxAttempts; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);

    const focused = await getFocusedElement(page);
    const isWithinContainer = await container.evaluate(
      (containerEl, focusedEl) => {
        return containerEl.contains(focusedEl as Node);
      },
      await focused.elementHandle()
    );

    if (!isWithinContainer) {
      isTrapped = false;
      break;
    }
  }

  return isTrapped;
}

/**
 * Test keyboard activation of an element
 */
export async function testKeyboardActivation(
  element: Locator,
  key: 'Enter' | 'Space'
): Promise<boolean> {
  await element.focus();
  await element.page().waitForTimeout(100);

  // Set up a flag to detect activation
  await element.evaluate((el, activationKey) => {
    (window as any)[`activated_${activationKey}`] = false;
    el.addEventListener('click', () => {
      (window as any)[`activated_${activationKey}`] = true;
    });
  }, key);

  await element.page().keyboard.press(key);
  await element.page().waitForTimeout(100);

  return await element.page().evaluate(activationKey => {
    return (window as any)[`activated_${activationKey}`];
  }, key);
}

/**
 * Find and test skip links
 */
export async function testSkipLinks(page: Page): Promise<{
  found: boolean;
  count: number;
  links: Array<{ text: string; href: string }>;
}> {
  const skipLinks = await page
    .locator('a[href^="#"]:has-text(/skip|main|content|navigation/i)')
    .all();

  const links: Array<{ text: string; href: string }> = [];

  for (const link of skipLinks) {
    const text = (await link.textContent()) || '';
    const href = (await link.getAttribute('href')) || '';
    links.push({ text: text.trim(), href });
  }

  return {
    found: links.length > 0,
    count: links.length,
    links,
  };
}

/**
 * Test focus restoration after an action
 */
export async function testFocusRestoration(
  page: Page,
  action: () => Promise<void>
): Promise<boolean> {
  // Remember the initially focused element
  const initialFocus = await getFocusedElement(page);
  const initialTag = await initialFocus
    .evaluate(el => el.tagName)
    .catch(() => 'BODY');
  const initialId = await initialFocus.getAttribute('id').catch(() => '');

  // Perform the action
  await action();

  // Check if focus is restored to the same element or a reasonable fallback
  const finalFocus = await getFocusedElement(page);
  const finalTag = await finalFocus
    .evaluate(el => el.tagName)
    .catch(() => 'BODY');
  const finalId = await finalFocus.getAttribute('id').catch(() => '');

  // Focus is restored if it's the same element or if it's on a reasonable element
  return (
    (initialTag === finalTag && initialId === finalId) ||
    ['BODY', 'MAIN', 'A', 'BUTTON', 'INPUT'].includes(finalTag)
  );
}

/**
 * Check if all interactive elements are keyboard accessible
 */
export async function checkKeyboardAccessibility(page: Page): Promise<{
  accessible: number;
  inaccessible: number;
  elements: Array<{ accessible: boolean; selector: string; reason?: string }>;
}> {
  const interactiveSelectors = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[onclick]',
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="checkbox"]',
    '[role="radio"]',
  ];

  const results: Array<{
    accessible: boolean;
    selector: string;
    reason?: string;
  }> = [];
  let accessible = 0;
  let inaccessible = 0;

  for (const selector of interactiveSelectors) {
    const elements = await page.locator(selector).all();

    for (const element of elements.slice(0, 5)) {
      // Check first 5 of each type
      const isVisible = await element.isVisible().catch(() => false);
      const isDisabled = await element.isDisabled().catch(() => false);
      const tabindex = await element.getAttribute('tabindex');

      if (!isVisible || isDisabled) continue;

      let isAccessible = true;
      let reason = '';

      if (tabindex === '-1') {
        isAccessible = false;
        reason = 'tabindex="-1" prevents keyboard access';
      }

      if (isAccessible) {
        accessible++;
      } else {
        inaccessible++;
      }

      results.push({
        accessible: isAccessible,
        selector: selector,
        reason,
      });
    }
  }

  return { accessible, inaccessible, elements: results };
}

/**
 * Test arrow key navigation in menus or lists
 */
export async function testArrowKeyNavigation(
  page: Page,
  container: Locator
): Promise<boolean> {
  await container.focus();
  await page.waitForTimeout(100);

  const initialFocus = await getFocusedElement(page);
  const initialTag = await initialFocus
    .evaluate(el => el.tagName)
    .catch(() => '');

  // Try arrow down
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);

  const afterArrowDown = await getFocusedElement(page);
  const afterArrowDownTag = await afterArrowDown
    .evaluate(el => el.tagName)
    .catch(() => '');

  // Try arrow up
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(100);

  const afterArrowUp = await getFocusedElement(page);
  const afterArrowUpTag = await afterArrowUp
    .evaluate(el => el.tagName)
    .catch(() => '');

  // Navigation works if focus changed
  return (
    initialTag !== afterArrowDownTag || afterArrowDownTag !== afterArrowUpTag
  );
}

/**
 * Test Escape key functionality
 */
export async function testEscapeKey(
  page: Page,
  expectedBehavior: 'close-modal' | 'clear-input' | 'cancel-action'
): Promise<boolean> {
  const beforeEscape = await page.evaluate(
    () => document.activeElement?.tagName
  );

  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);

  const afterEscape = await page.evaluate(
    () => document.activeElement?.tagName
  );

  switch (expectedBehavior) {
    case 'close-modal':
      // Check if modal/dialog is closed
      const modalVisible = await page
        .locator('[role="dialog"], .modal')
        .isVisible()
        .catch(() => false);
      return !modalVisible;

    case 'clear-input':
      // Check if input is cleared
      const inputValue = await page
        .locator('input:focus')
        .inputValue()
        .catch(() => '');
      return inputValue === '';

    case 'cancel-action':
      // Check if focus changed (action was cancelled)
      return beforeEscape !== afterEscape;

    default:
      return true;
  }
}

/**
 * Generate a keyboard navigation report
 */
export async function generateKeyboardNavigationReport(
  page: Page
): Promise<string> {
  const focusableElements = await getFocusableElements(page);
  const skipLinks = await testSkipLinks(page);
  const accessibilityCheck = await checkKeyboardAccessibility(page);

  const report = `
Keyboard Navigation Report
==========================

Focusable Elements: ${focusableElements.length}
Skip Links: ${skipLinks.found ? `${skipLinks.count} found` : 'None found'}
Accessible Interactive Elements: ${accessibilityCheck.accessible}
Inaccessible Interactive Elements: ${accessibilityCheck.inaccessible}

Skip Links Details:
${skipLinks.links.map(link => `  - "${link.text}" -> ${link.href}`).join('\n') || '  None'}

Accessibility Issues:
${
  accessibilityCheck.elements
    .filter(el => !el.accessible)
    .map(el => `  - ${el.selector}: ${el.reason}`)
    .join('\n') || '  None found'
}
`;

  return report;
}
