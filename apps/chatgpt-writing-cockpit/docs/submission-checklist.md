# ChatGPT App Submission Checklist

## Product metadata

- App name and short description finalized
- Support email/contact set
- Privacy policy URL set
- Terms URL set (if applicable)

## Technical metadata

- Production MCP URL over HTTPS
- `_meta.ui.csp` has exact `connectDomains` + `resourceDomains`
- `_meta.ui.domain` configured for production widget host
- Tool descriptions start with "Use this when..."
- Tool annotations (`idempotentHint`, `readOnlyHint`, etc.) reviewed

## Security and reliability

- No tokens/secrets in tool output, logs, or widget state
- Timeout/auth errors map to normalized error contract
- Trace IDs present on all success/error tool outputs

## Validation assets

- Test prompts for all 5 tools
- Screenshots/video of widget flows
- Manual Dev Mode run-through notes
- Regression checklist for gateway down/timeout/auth failure

## Release gate

- `npm run verify` passing
- Production smoke against hosted MCP endpoint
- Internal review complete
