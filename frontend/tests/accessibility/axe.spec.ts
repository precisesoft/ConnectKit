import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Comprehensive Accessibility Testing with Axe-core
 * Tests WCAG 2.1 AA compliance across key application pages
 */

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any common test conditions
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Home page should be accessible', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Wait for any content to be visible (fallback to body if no main)
    try {
      await page.waitForSelector('main, body', {
        state: 'visible',
        timeout: 10000,
      });
    } catch {
      // Continue with test even if specific elements aren't found
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Login page should be accessible', async ({ page }) => {
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for form or content to be visible
    try {
      await page.waitForSelector('form, main, body', {
        state: 'visible',
        timeout: 10000,
      });
    } catch {
      // Continue with test even if specific elements aren't found
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Registration page should be accessible', async ({ page }) => {
    await page.goto('/register');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for form or content to be visible
    try {
      await page.waitForSelector('form, main, body', {
        state: 'visible',
        timeout: 10000,
      });
    } catch {
      // Continue with test even if specific elements aren't found
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Navigation should be accessible', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for navigation elements to load (graceful fallback)
    try {
      await page.waitForSelector('nav, header, [role="navigation"], body', {
        state: 'visible',
        timeout: 10000,
      });
    } catch {
      // Continue with test even if specific elements aren't found
    }

    // Test navigation accessibility - include full page if no nav found
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Form elements should be accessible', async ({ page }) => {
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for form elements to load (graceful fallback)
    try {
      await page.waitForSelector('input, button, form, body', {
        state: 'visible',
        timeout: 10000,
      });
    } catch {
      // Continue with test even if specific elements aren't found
    }

    // Test form accessibility - scan entire page
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Images should have proper alt text', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Mobile viewport should be accessible', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // Test with specific accessibility rules for enterprise compliance
  test('Enterprise accessibility compliance', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'section508'])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        'Accessibility violations found:',
        accessibilityScanResults.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
        }))
      );
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

// Test specific error scenarios for accessibility
test.describe('Error Handling Accessibility', () => {
  test('404 page should be accessible', async ({ page }) => {
    await page.goto('/non-existent-page');

    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
