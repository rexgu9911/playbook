# Playbook

The best AI-made web games, in one place, plus open recipes you can remake in your own coding agent.

**Live:** https://rexgu9911.github.io/playbook/

## Discover: how listings work
- Every game in Discover belongs to its creator. We link to the creator's own page and credit the post where it was shared.
- Card images are the creator's own share image (`og:image`), loaded from their site. Nothing is copied or hosted here.
- Every link is checked by hand before it is listed, and re-checked weekly.

## Is a listing yours?
Use **"Is this yours? Claim or remove"** on its card, or [open an issue](https://github.com/rexgu9911/playbook/issues/new?labels=removal&title=Remove:%20). Removal requests from creators are acted on as soon as we see them. To keep a page out of Playbook for good, add `<meta name="playbook" content="no-list">` to it.

## Submit a game
Use **"Submit a game"** on the site, or [open an issue](https://github.com/rexgu9911/playbook/issues/new?labels=submission&title=Submit:%20) with the playable link and where it was shared.

## Playbook MCP
Pull a recipe or a game-feel mechanic into your own coding agent. Free, open source, no account:

```bash
claude mcp add playbook -- npx -y github:rexgu9911/playbook-mcp
```

Setup for Cursor, Codex and Claude Desktop: [playbook-mcp](https://github.com/rexgu9911/playbook-mcp).

## Public API
Static JSON, read by the MCP server and free for anyone to use: [`api/index.json`](https://rexgu9911.github.io/playbook/api/index.json), `api/recipes.json`, `api/mechanics.json`, `api/discover.json`.

## License
Playbook's own code, recipes and mechanics are MIT. Games listed under Discover belong to their creators and are not covered; see [LICENSE](LICENSE).

## Coming soon
One-command publishing and Jam #1.
