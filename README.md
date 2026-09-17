# SecureShare ABE

A working model of attribute-based access control for file sharing. Users carry attributes — a role and a department — and every file carries a sensitivity level. Access is granted per file, per user, through a request and key-issuance flow, rather than by a blanket share link.

## The flow

1. A file is uploaded and classified `Low` / `Medium` / `High` / `Top Secret`. It starts `LOCKED`.
2. A user requests access. The request goes `PENDING`.
3. An admin approves or rejects it against the requester's attributes — role (`ADMIN` / `USER` / `GUEST`) and department.
4. On approval, the system issues a secret key scoped to that user and that file.
5. The user enters the key and the file is decrypted locally, in the browser. Nothing is decrypted server-side.

## Note on scope

This implements the ABE *workflow* — attribute-driven policy, per-file key issuance, local decryption — as a simulation. The access-control logic is real; the underlying pairing-based CP-ABE cryptography is not implemented. Said plainly here because a file-sharing tool that overstates its cryptography is worse than one that doesn't claim it.

## Stack

React 19 · TypeScript · Vite · Google Gemini (assistant chat)

## Run locally

Prerequisites: Node.js

```bash
npm install
npm run dev
```

Set `GEMINI_API_KEY` in `.env.local` before running.
