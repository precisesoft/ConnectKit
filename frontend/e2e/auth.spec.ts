import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the application
    await page.goto('/');
  });

  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      // Navigate to login page
      await page.click('[data-testid="login-button"]');

      // Fill login form
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');

      // Submit form
      await page.click('[data-testid="submit-button"]');

      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard');

      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="welcome-message"]')
      ).toContainText('Welcome');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.click('[data-testid="login-button"]');

      await page.fill('[data-testid="email-input"]', 'invalid@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');

      await page.click('[data-testid="submit-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'Invalid credentials'
      );

      // Should remain on login page
      await expect(page).toHaveURL(/.*login/);
    });

    test('should validate form fields', async ({ page }) => {
      await page.click('[data-testid="login-button"]');

      // Try to submit empty form
      await page.click('[data-testid="submit-button"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="email-error"]')).toContainText(
        'Email is required'
      );
      await expect(
        page.locator('[data-testid="password-error"]')
      ).toContainText('Password is required');
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.click('[data-testid="login-button"]');

      const passwordInput = page.locator('[data-testid="password-input"]');
      const toggleButton = page.locator('[data-testid="password-toggle"]');

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle button
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should handle remember me functionality', async ({ page }) => {
      await page.click('[data-testid="login-button"]');

      // Check remember me
      await page.check('[data-testid="remember-me"]');

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');

      await page.click('[data-testid="submit-button"]');

      // Wait for successful login
      await page.waitForURL('/dashboard');

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Navigate back to login - email should be remembered
      await page.goto('/login');
      await expect(page.locator('[data-testid="email-input"]')).toHaveValue(
        'test@example.com'
      );
    });
  });

  test.describe('Registration', () => {
    test('should register new user successfully', async ({ page }) => {
      await page.click('[data-testid="register-button"]');

      // Fill registration form
      await page.fill('[data-testid="username-input"]', 'newuser123');
      await page.fill('[data-testid="email-input"]', 'newuser@example.com');
      await page.fill('[data-testid="password-input"]', 'NewPass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'NewPass123!');
      await page.fill('[data-testid="first-name-input"]', 'New');
      await page.fill('[data-testid="last-name-input"]', 'User');

      await page.click('[data-testid="submit-button"]');

      // Should show success message
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toContainText('Registration successful');
    });

    test('should validate password requirements', async ({ page }) => {
      await page.click('[data-testid="register-button"]');

      await page.fill('[data-testid="password-input"]', 'weak');
      await page.blur('[data-testid="password-input"]');

      // Should show password strength requirements
      await expect(
        page.locator('[data-testid="password-requirements"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="requirement-length"]')
      ).toHaveClass(/invalid/);
    });

    test('should validate password confirmation match', async ({ page }) => {
      await page.click('[data-testid="register-button"]');

      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.fill(
        '[data-testid="confirm-password-input"]',
        'DifferentPass123!'
      );
      await page.blur('[data-testid="confirm-password-input"]');

      await expect(
        page.locator('[data-testid="confirm-password-error"]')
      ).toContainText('Passwords do not match');
    });

    test('should handle duplicate email error', async ({ page }) => {
      await page.click('[data-testid="register-button"]');

      // Fill form with existing email
      await page.fill('[data-testid="username-input"]', 'testuser2');
      await page.fill('[data-testid="email-input"]', 'existing@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
      await page.fill('[data-testid="first-name-input"]', 'Test');
      await page.fill('[data-testid="last-name-input"]', 'User');

      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'Email already exists'
      );
    });
  });

  test.describe('Password Reset', () => {
    test('should handle forgot password flow', async ({ page }) => {
      await page.click('[data-testid="login-button"]');
      await page.click('[data-testid="forgot-password-link"]');

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.click('[data-testid="submit-button"]');

      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toContainText('password reset link');
    });

    test('should reset password with valid token', async ({ page }) => {
      // Navigate to reset password page with token
      await page.goto('/reset-password?token=valid-reset-token');

      await page.fill('[data-testid="new-password-input"]', 'NewPass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'NewPass123!');

      await page.click('[data-testid="submit-button"]');

      await expect(
        page.locator('[data-testid="success-message"]')
      ).toContainText('Password reset successful');
    });

    test('should handle invalid reset token', async ({ page }) => {
      await page.goto('/reset-password?token=invalid-token');

      await page.fill('[data-testid="new-password-input"]', 'NewPass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'NewPass123!');

      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'Invalid or expired'
      );
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.click('[data-testid="login-button"]');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.click('[data-testid="submit-button"]');

      await page.waitForURL('/dashboard');

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Should redirect to home page
      await page.waitForURL('/');

      // Login button should be visible again
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await page.waitForURL(/.*login/);
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    test('should allow authenticated users to access protected routes', async ({
      page,
    }) => {
      // Login first
      await page.click('[data-testid="login-button"]');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.click('[data-testid="submit-button"]');

      await page.waitForURL('/dashboard');

      // Should be able to access contacts page
      await page.goto('/contacts');
      await expect(page.locator('[data-testid="contacts-page"]')).toBeVisible();

      // Should be able to access profile page
      await page.goto('/profile');
      await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      // Login
      await page.click('[data-testid="login-button"]');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.click('[data-testid="submit-button"]');

      await page.waitForURL('/dashboard');

      // Refresh page
      await page.reload();

      // Should still be logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should handle token expiration gracefully', async ({ page }) => {
      // This would require mocking the API or using expired tokens
      // For demo purposes, we'll simulate by clearing storage

      await page.click('[data-testid="login-button"]');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.click('[data-testid="submit-button"]');

      await page.waitForURL('/dashboard');

      // Clear tokens to simulate expiration
      await page.evaluate(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });

      // Try to navigate to protected route
      await page.goto('/contacts');

      // Should redirect to login
      await page.waitForURL(/.*login/);
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.click('[data-testid="login-button"]');

      // Tab through form elements
      await page.keyboard.press('Tab'); // Email input
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Password input
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeFocused();

      await page.keyboard.press('Tab'); // Toggle button
      await page.keyboard.press('Tab'); // Remember me
      await expect(page.locator('[data-testid="remember-me"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Submit button
      await expect(page.locator('[data-testid="submit-button"]')).toBeFocused();
    });

    test('should support screen readers', async ({ page }) => {
      await page.click('[data-testid="login-button"]');

      // Check for proper ARIA labels
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
        'aria-label',
        /email/i
      );
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toHaveAttribute('aria-label', /password/i);

      // Error messages should have proper roles
      await page.click('[data-testid="submit-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toHaveAttribute(
        'role',
        'alert'
      );
    });

    test('should pass axe accessibility checks', async ({ page }) => {
      const { injectAxe, checkA11y } = await import('@axe-core/playwright');

      await page.click('[data-testid="login-button"]');

      // Inject axe-core
      await injectAxe(page);

      // Run accessibility checks
      const accessibilityScanResults = await checkA11y(page);
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper color contrast', async ({ page }) => {
      const { injectAxe, checkA11y } = await import('@axe-core/playwright');

      await page.click('[data-testid="login-button"]');

      // Inject axe and check color contrast specifically
      await injectAxe(page);
      const results = await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results.violations.filter(v => v.id === 'color-contrast')).toEqual(
        []
      );
    });

    test('should handle high contrast mode', async ({ page }) => {
      // Emulate high contrast mode
      await page.emulateMedia({ forcedColors: 'active' });

      await page.click('[data-testid="login-button"]');

      // Verify form is still usable in high contrast mode
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
    });

    test('should support zoom up to 200%', async ({ page }) => {
      await page.click('[data-testid="login-button"]');

      // Set zoom to 200%
      await page.setViewportSize({ width: 800, height: 600 });
      await page.evaluate(() => {
        document.body.style.zoom = '200%';
      });

      // Verify form is still usable at high zoom
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
    });

    test('should have proper heading structure', async ({ page }) => {
      await page.click('[data-testid="login-button"]');

      // Check heading hierarchy
      const h1Elements = page.locator('h1');
      await expect(h1Elements).toHaveCount(1);
      await expect(h1Elements.first()).toContainText(
        /welcome back|sign in|login/i
      );
    });

    test('should announce form changes to screen readers', async ({ page }) => {
      await page.click('[data-testid="login-button"]');

      // Fill invalid email to trigger validation
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="password-input"]'); // Blur email field

      // Check that error message has proper ARIA attributes
      const errorElement = page.locator('[data-testid="email-error"]');
      await expect(errorElement).toHaveAttribute('role', 'alert');
      await expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  test.describe('Performance', () => {
    test('should load login page quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.click('[data-testid="login-button"]');
      await page.waitForLoadState('networkidle');

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });
  });
});
