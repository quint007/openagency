# INFRA KNOWLEDGE BASE

## OVERVIEW
`infra/` is the OpenTofu domain for environment-specific infrastructure and reusable modules. It is structurally distinct but currently lightly documented.

## STRUCTURE
```text
infra/
├── environments/staging/
├── environments/production/
└── modules/
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Domain overview | `infra/README.md` | Currently minimal |
| Staging env | `infra/environments/staging/` | Placeholder README today |
| Production env | `infra/environments/production/` | Placeholder README today |
| Shared modules | `infra/modules/` | Placeholder README today |

## CONVENTIONS
- Keep infra guidance domain-specific; do not mix application runtime notes into this directory.
- `docs/contributing.md` says OpenTofu is optional and only needed when touching `infra/`.

## ANTI-PATTERNS
- Do not assume app-level setup docs cover infra workflows; they currently do not.
- Do not over-document placeholders as if the module were already fully specified.
- Do not bury environment-specific behavior in root docs when it belongs in `infra/environments/*`.

## COMMANDS
```bash
devbox run tofu --version
```

## NOTES
- This area likely needs future expansion once real module and environment configuration lands.
