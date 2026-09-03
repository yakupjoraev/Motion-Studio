# Changesets

`docs/DEVOPS.md` § Releases. A change that a user would notice gets a changeset; a change to the
build, the tests or the documentation does not.

```bash
pnpm changeset          # describe the change, pick the bump
pnpm changeset version  # apply the bumps and write CHANGELOG.md
git push --follow-tags  # release.yml takes it from the tag
```

Two settings here are decisions rather than defaults:

- **`fixed`** — every workspace package moves together. They are not published to npm in v1, so
  independent versions would be ceremony: there is one product and one version number.
- **`privatePackages.version: true`** — the packages are all `private`, and without this changesets
  would refuse to touch them, which would leave the version number nowhere.

`e2e` is ignored: it is the test suite, it ships to nobody, and a bump on it would be noise in a
changelog someone reads to find out what changed in the product.
