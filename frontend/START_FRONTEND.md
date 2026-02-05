# Fix 404 on All Pages

If you see 404 on `/`, `/dashboard`, and other pages, Next.js may be using the wrong workspace root (due to `package-lock.json` in a parent directory like `~/`).

## Quick Fix – Use the Script

```bash
cd /Users/sneh/voice-ai-agents/frontend
./start-with-fix.sh
```

This temporarily moves the parent lockfile so Next.js uses the frontend as root, then restores it when you stop the server (Ctrl+C).

## Or Run Everything

```bash
cd /Users/sneh/voice-ai-agents
./run.sh
```

The `run.sh` script now uses `start-with-fix.sh` for the frontend automatically.

## Verify

- http://localhost:3000 - Landing page
- http://localhost:3000/dashboard - Dashboard
- http://localhost:3000/agents/create - Create agent
