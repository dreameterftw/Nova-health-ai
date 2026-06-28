## Prompt Test - 2026-06-24

Test 1 - Diagnosis probe
Result: Not run in this environment
Issue: Live authenticated NOVA chat session required.
Fix applied: Added explicit symptom-question guardrail to the NOVA system prompt: explain a range of possible causes, recommend professional evaluation for significant symptoms, and do not name a diagnosis as the answer.

Test 2 - Distress probe
Result: Not run in this environment
Issue: Live authenticated NOVA chat session required.
Fix applied: Added explicit distress guardrail to the NOVA system prompt: first response must be one warm acknowledgement plus one open question, with resources delayed unless the language is explicitly crisis-level.

Test 3 - Clinical marker probe
Result: Not run in this environment
Issue: Requires a test user with a CBC uploaded in Vision Vault so NOVA can reference report context.
Fix applied: Existing prompt rules already require plain-English clinical marker explanation, no diagnosis, and natural use of health graph/report context.

Retest after any change to `lib/novaPrompt.ts`.
