import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email and password fields
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    
    // Check for login button
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder(/email/i).fill('invalid@test.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Wait for error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    
    // Use test credentials (update with your test account)
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/password/i).fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Should see dashboard content
    await expect(page.getByText(/process intelligence hub/i)).toBeVisible();
  });

  test('should be able to toggle between login and signup', async ({ page }) => {
    await page.goto('/login');
    
    // Should start with login form
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
    
    // Click to switch to signup
    await page.getByText(/sign up/i).click();
    
    // Should now show name field and signup button
    await expect(page.getByPlaceholder(/name/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/password/i).fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/.*dashboard/);
  });

  test('should display dashboard components', async ({ page }) => {
    // Check for main dashboard elements
    await expect(page.getByText(/process intelligence hub/i)).toBeVisible();
    
    // Check for filters
    await expect(page.getByText(/time range/i)).toBeVisible();
    await expect(page.getByText(/severity filter/i)).toBeVisible();
  });

  test('should be able to change time range', async ({ page }) => {
    const timeRangeSelect = page.locator('select').filter({ hasText: /last 1 hour/i }).first();
    await timeRangeSelect.selectOption({ label: 'Last 24 hours' });
    
    // Verify the selection changed
    await expect(timeRangeSelect).toHaveValue('24h');
  });

  test('should be able to export data', async ({ page }) => {
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export report/i }).click();
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify download started
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should require authentication', async ({ page, context }) => {
    // Clear cookies to simulate logged out state
    await context.clearCookies();
    
    // Try to navigate to dashboard
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Process Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/password/i).fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/.*dashboard/);
  });

  test('should display process timeline chart', async ({ page }) => {
    // Check if chart container is visible
    await expect(page.locator('[class*="recharts"]')).toBeVisible();
  });

  test('should show AI insights', async ({ page }) => {
    // Check for insights panel
    await expect(page.getByText(/ai insights/i)).toBeVisible();
  });

  test('should filter by severity', async ({ page }) => {
    // Find severity checkboxes
    const criticalCheckbox = page.getByLabel(/critical/i);
    
    // Uncheck critical
    if (await criticalCheckbox.isChecked()) {
      await criticalCheckbox.click();
    }
    
    // Verify it's unchecked
    await expect(criticalCheckbox).not.toBeChecked();
  });
});
