# Licences — vendored source

`docs/DESIGN_REFERENCES.md` § Vendored requires this file. It is the other half of
`packages/blocks/LICENSES.md`, and the two exist for opposite reasons: that file records references
that were **looked at**, this one records source that was **copied**.

Only one project qualifies. shadcn/ui is MIT and is distributed as copy-into-your-project source —
that is its model, not a loophole — so its components may be vendored here and adapted to our tokens
and density. Nothing else in this package is copied from anywhere: the Radix primitives underneath
are ordinary dependencies, declared in `package.json` and installed, not vendored.

## shadcn/ui

| Field | Verified |
| --- | --- |
| Verified on | 2026-09-04, against `https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md` |
| Licence | MIT |
| Copyright line | `Copyright (c) 2023 shadcn` |
| What was taken | Component structure and composition for the studio's chrome primitives and the inspector's control shells, adapted to our tokens, density scale and motion policy. |
| Where it lives | `packages/ui/src` — the primitives and `src/controls`, as `packages/ui/README.md` states. |

The MIT notice, reproduced in full because that is what the licence asks of anyone distributing the
source — and this product's whole point is that a user exports and ships component source:

```
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
