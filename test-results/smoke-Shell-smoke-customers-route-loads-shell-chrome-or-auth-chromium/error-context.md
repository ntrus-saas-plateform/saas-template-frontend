# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Shell smoke >> customers route loads shell chrome or auth
- Location: e2e\smoke.spec.ts:10:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\LENOVO\AppData\Local\Temp\cursor-sandbox-cache\0303015ead8ba341c58d45e5785f6cab\playwright\chromium_headless_shell-1234\chrome-headless-shell-win64\chrome-headless-shell.exe
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     pnpm exec playwright install                           ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```