**Accessibility Testing**

**What It Does**

- This workflow helps automate checks for accessibility testing. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.

**When It Runs**

- Manually from GitHub (Run workflow)
- On pull request (branches: main, develop)
- On push (branches: main)

**Visual Overview**

```mermaid
flowchart LR
  T[Triggers\nworkflow dispatch\npull request\npush]
  J_lighthouse_a11y[Lighthouse Accessibility]
  J_axe_core_tests[Axe-core Tests]
  J_wave_testing[WAVE Testing]
  J_color_contrast[Color Contrast]
  J_keyboard_navigation[Keyboard Navigation]
  J_accessibility_report[Accessibility Report]
  T --> J_lighthouse_a11y
  T --> J_axe_core_tests
  T --> J_wave_testing
  T --> J_color_contrast
  T --> J_keyboard_navigation
  J_lighthouse_a11y --> J_accessibility_report
  J_axe_core_tests --> J_accessibility_report
  J_wave_testing --> J_accessibility_report
  J_color_contrast --> J_accessibility_report
  J_keyboard_navigation --> J_accessibility_report
```

**Jobs & Steps**

- Job: Lighthouse Accessibility
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: lighthouse-results-${{ github.run_number }}
  - What happens:
    - Use actions/checkout@v4
    - Setup Node.js
    - Cache node_modules
    - Install dependencies
    - Build frontend
    - Start frontend server
    - Install Lighthouse CI
    - Run Lighthouse accessibility tests
    - Upload Lighthouse results
    - Stop frontend server
- Job: Axe-core Tests
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: axe-results-${{ github.run_number }}
  - What happens:
    - Use actions/checkout@v4
    - Setup Node.js
    - Cache node_modules
    - Install dependencies
    - Install Playwright
    - Build frontend
    - Start frontend server
    - Run Axe accessibility tests
    - Upload Axe results
    - Stop frontend server
- Job: WAVE Testing
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: wave-results-${{ github.run_number }}
  - What happens:
    - Use actions/checkout@v4
    - Setup Node.js
    - Cache node_modules
    - Install dependencies
    - Build frontend
    - Start frontend server
    - Run WAVE-style tests
    - Upload WAVE results
    - Stop frontend server
- Job: Color Contrast
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: color-contrast-results-${{ github.run_number }}
  - What happens:
    - Use actions/checkout@v4
    - Setup Node.js
    - Cache node_modules
    - Install dependencies
    - Build frontend
    - Start frontend server
    - Run color contrast tests
    - Upload color contrast results
    - Stop frontend server
- Job: Keyboard Navigation
  - Runner: ubuntu-latest
  - Depends on: None
  - Artifacts: keyboard-results-${{ github.run_number }}
  - What happens:
    - Use actions/checkout@v4
    - Setup Node.js
    - Cache node_modules
    - Install dependencies
    - Install Playwright
    - Build frontend
    - Start frontend server
    - Run keyboard navigation tests
    - Upload keyboard navigation results
    - Stop frontend server
- Job: Accessibility Report
  - Runner: ubuntu-latest
  - Depends on: Lighthouse A11y, Axe Core Tests, Wave Testing, Color Contrast, Keyboard Navigation
  - Artifacts: accessibility-report-${{ github.run_number }}
  - What happens:
    - Use actions/checkout@v4
    - Download all test artifacts
    - Generate accessibility summary
    - Add summary to GitHub Step Summary
    - Upload accessibility report

**Step Diagrams**
**Lighthouse Accessibility — Steps**

```mermaid
flowchart TB
  S_lighthouse_a11y_0[Use actions/checkout@v4]
  S_lighthouse_a11y_1[Setup Node.js]
  S_lighthouse_a11y_0 --> S_lighthouse_a11y_1
  S_lighthouse_a11y_2[Cache node_modules]
  S_lighthouse_a11y_1 --> S_lighthouse_a11y_2
  S_lighthouse_a11y_3[Install dependencies]
  S_lighthouse_a11y_2 --> S_lighthouse_a11y_3
  S_lighthouse_a11y_4[Build frontend]
  S_lighthouse_a11y_3 --> S_lighthouse_a11y_4
  S_lighthouse_a11y_5[Start frontend server]
  S_lighthouse_a11y_4 --> S_lighthouse_a11y_5
  S_lighthouse_a11y_6[Install Lighthouse CI]
  S_lighthouse_a11y_5 --> S_lighthouse_a11y_6
  S_lighthouse_a11y_7[Run Lighthouse accessibility tests]
  S_lighthouse_a11y_6 --> S_lighthouse_a11y_7
  S_lighthouse_a11y_8[Upload Lighthouse results]
  S_lighthouse_a11y_7 --> S_lighthouse_a11y_8
  S_lighthouse_a11y_9[Stop frontend server]
  S_lighthouse_a11y_8 --> S_lighthouse_a11y_9
```

**Axe-core Tests — Steps**

```mermaid
flowchart TB
  S_axe_core_tests_0[Use actions/checkout@v4]
  S_axe_core_tests_1[Setup Node.js]
  S_axe_core_tests_0 --> S_axe_core_tests_1
  S_axe_core_tests_2[Cache node_modules]
  S_axe_core_tests_1 --> S_axe_core_tests_2
  S_axe_core_tests_3[Install dependencies]
  S_axe_core_tests_2 --> S_axe_core_tests_3
  S_axe_core_tests_4[Install Playwright]
  S_axe_core_tests_3 --> S_axe_core_tests_4
  S_axe_core_tests_5[Build frontend]
  S_axe_core_tests_4 --> S_axe_core_tests_5
  S_axe_core_tests_6[Start frontend server]
  S_axe_core_tests_5 --> S_axe_core_tests_6
  S_axe_core_tests_7[Run Axe accessibility tests]
  S_axe_core_tests_6 --> S_axe_core_tests_7
  S_axe_core_tests_8[Upload Axe results]
  S_axe_core_tests_7 --> S_axe_core_tests_8
  S_axe_core_tests_9[Stop frontend server]
  S_axe_core_tests_8 --> S_axe_core_tests_9
```

**WAVE Testing — Steps**

```mermaid
flowchart TB
  S_wave_testing_0[Use actions/checkout@v4]
  S_wave_testing_1[Setup Node.js]
  S_wave_testing_0 --> S_wave_testing_1
  S_wave_testing_2[Cache node_modules]
  S_wave_testing_1 --> S_wave_testing_2
  S_wave_testing_3[Install dependencies]
  S_wave_testing_2 --> S_wave_testing_3
  S_wave_testing_4[Build frontend]
  S_wave_testing_3 --> S_wave_testing_4
  S_wave_testing_5[Start frontend server]
  S_wave_testing_4 --> S_wave_testing_5
  S_wave_testing_6[Run WAVE-style tests]
  S_wave_testing_5 --> S_wave_testing_6
  S_wave_testing_7[Upload WAVE results]
  S_wave_testing_6 --> S_wave_testing_7
  S_wave_testing_8[Stop frontend server]
  S_wave_testing_7 --> S_wave_testing_8
```

**Color Contrast — Steps**

```mermaid
flowchart TB
  S_color_contrast_0[Use actions/checkout@v4]
  S_color_contrast_1[Setup Node.js]
  S_color_contrast_0 --> S_color_contrast_1
  S_color_contrast_2[Cache node_modules]
  S_color_contrast_1 --> S_color_contrast_2
  S_color_contrast_3[Install dependencies]
  S_color_contrast_2 --> S_color_contrast_3
  S_color_contrast_4[Build frontend]
  S_color_contrast_3 --> S_color_contrast_4
  S_color_contrast_5[Start frontend server]
  S_color_contrast_4 --> S_color_contrast_5
  S_color_contrast_6[Run color contrast tests]
  S_color_contrast_5 --> S_color_contrast_6
  S_color_contrast_7[Upload color contrast results]
  S_color_contrast_6 --> S_color_contrast_7
  S_color_contrast_8[Stop frontend server]
  S_color_contrast_7 --> S_color_contrast_8
```

**Keyboard Navigation — Steps**

```mermaid
flowchart TB
  S_keyboard_navigation_0[Use actions/checkout@v4]
  S_keyboard_navigation_1[Setup Node.js]
  S_keyboard_navigation_0 --> S_keyboard_navigation_1
  S_keyboard_navigation_2[Cache node_modules]
  S_keyboard_navigation_1 --> S_keyboard_navigation_2
  S_keyboard_navigation_3[Install dependencies]
  S_keyboard_navigation_2 --> S_keyboard_navigation_3
  S_keyboard_navigation_4[Install Playwright]
  S_keyboard_navigation_3 --> S_keyboard_navigation_4
  S_keyboard_navigation_5[Build frontend]
  S_keyboard_navigation_4 --> S_keyboard_navigation_5
  S_keyboard_navigation_6[Start frontend server]
  S_keyboard_navigation_5 --> S_keyboard_navigation_6
  S_keyboard_navigation_7[Run keyboard navigation tests]
  S_keyboard_navigation_6 --> S_keyboard_navigation_7
  S_keyboard_navigation_8[Upload keyboard navigation results]
  S_keyboard_navigation_7 --> S_keyboard_navigation_8
  S_keyboard_navigation_9[Stop frontend server]
  S_keyboard_navigation_8 --> S_keyboard_navigation_9
```

**Accessibility Report — Steps**

```mermaid
flowchart TB
  S_accessibility_report_0[Use actions/checkout@v4]
  S_accessibility_report_1[Download all test artifacts]
  S_accessibility_report_0 --> S_accessibility_report_1
  S_accessibility_report_2[Generate accessibility summary]
  S_accessibility_report_1 --> S_accessibility_report_2
  S_accessibility_report_3[Add summary to GitHub Step Summary]
  S_accessibility_report_2 --> S_accessibility_report_3
  S_accessibility_report_4[Upload accessibility report]
  S_accessibility_report_3 --> S_accessibility_report_4
```

**Required Secrets**

- None

**How To Run Manually**

- Go to your repository on GitHub
- Click the Actions tab
- Select "Accessibility Testing" from the left sidebar
- Click the Run workflow button and follow prompts

**Where To See Results**

- Action run summary shows job status and logs
- Artifacts section provides downloadable reports (if any)
- Annotations highlight warnings and errors in code

**Troubleshooting Tips**

- If a step fails, open the step log to see details
- Ensure required secrets exist under Settings > Secrets and variables > Actions
- Check that referenced paths and scripts exist in the repo
