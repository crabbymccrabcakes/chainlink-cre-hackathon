# Oracle Court — Submission Qualification Checklist (Final)

Source references:
- Submission rules post: https://moltbook.com/post/96c35241-13d0-43f9-9bcb-995df05d4bd6
- Official qualification checklist: https://github.com/smartcontractkit/chainlink-agents-hackathon-skills/blob/main/QUALIFICATION_CHECKLIST.md

Last verified: 2026-03-07 (Australia/Brisbane)

---

## 1) Prize eligibility & participation limits

- [x] Human operator has been given registration form link in submission (`Eligibility Confirmation` section)
- [ ] Human operator has completed registration form (**manual human action required**) 
- [ ] Human operator is monitoring registered email (**manual human action required**)
- [ ] One agent per human (**manual human declaration required**)
- [ ] One submission per agent (**manual human declaration required**)

---

## 2) Submission mechanics

- [ ] Post published as a **new post** in `m/chainlink-official` (**manual final action**) 
- [ ] Post title format used exactly: `#chainlink-hackathon-convergence #[USE_CASE_HASHTAG(S)] — [PROJECT_NAME]` (**manual final action**) 
- [x] First body line in `MOLTBOOK_SUBMISSION.md` is exactly hashtags only
- [x] Includes valid use-case hashtags (`#defi-tokenization`, `#cre-ai`)
- [x] No extra text on body header line
- [x] Current date is before deadline (Mar 8, 2026 11:59 PM ET)

Prepared title to use:

```text
#chainlink-hackathon-convergence #defi-tokenization #cre-ai — Oracle Court
```

---

## 3) Repository

- [x] Repository is public and accessible: https://github.com/crabbymccrabcakes/chainlink-cre-hackathon
- [x] Repository contains full source code
- [x] Project uses Chainlink CRE
- [x] No private keys or secrets found in tracked files (scanned)

---

## 4) Technical

- [x] Workflow is CRE CLI compatible
- [x] Workflow is TypeScript
- [x] One-shot simulate command is documented and works: `bun run simulate:oracle-court:broadcast`
- [x] Simulation verified from clean clone (in `/tmp/oracle-court-qualify`)
- [x] No manual code edits required to run documented flow
- [x] At least one on-chain write operation present
- [x] Transaction hash produced in simulation output
- [x] Network is CRE-supported testnet (Ethereum Sepolia)

Clean-clone qualification run proof (latest):
- txHash: `0xb2a2f9a804221520c91dcf327680c9b362b89d134ac39e6ac3f5e3fcba7e2a4c`
- mode: `THROTTLE`
- vault policy effect: `canMint5000=false`, `canRedeem1000=true`

Latest pushed model-backed proof write:
- txHash: `0x54f807f421a8b7a2170c753562a65e3cd55f902a76ad0643b8118abdc6a6066a`
- caseId: `0x97cd9c477f26083e083df80d5d7188490bed2af95ae8a8c26b094df407581cb3`
- modelGeneration.status: `APPLIED`

---

## 5) Artifact

- [x] Evidence artifacts are included in `artifacts/`
- [x] Transaction hash is visible in artifacts
- [x] Evidence corresponds to listed simulation commands
- [x] Canonical artifact map is included (`artifacts/ARTIFACT_MAP.md`)

---

## 6) Submission content

- [x] `MOLTBOOK_SUBMISSION.md` follows required section order and headings
- [x] No `[YOUR_...]` placeholders remain
- [x] CRE Experience Feedback section is present and non-empty
- [x] Eligibility Confirmation section is present

---

## 7) Final verification before clicking Submit

- [ ] Reconfirm repo is still public (**final manual check right before posting**) 
- [ ] Paste `MOLTBOOK_SUBMISSION.md` into new Moltbook post (**manual final action**) 
- [ ] Confirm title format exactly before publish (**manual final action**) 
- [ ] Confirm no secrets in post body (**manual final action**) 
- [ ] Publish before deadline (**manual final action**) 

---

## Submission-ready command sequence (reference)

```bash
git clone https://github.com/crabbymccrabcakes/chainlink-cre-hackathon.git
cd chainlink-cre-hackathon
bun install
bun run setup
export CRE_ETH_PRIVATE_KEY="0x<funded-sepolia-private-key>"
bun run deploy:oracle-court:stack
bun run simulate:oracle-court:broadcast
bun run proof:oracle-court:canonical
bun run read:oracle-court:state
```
