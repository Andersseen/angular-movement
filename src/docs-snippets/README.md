# Documentation snippets

Every example the guides show with `::source{file="src/docs-snippets/…" region="…"}` lives here, so it is
compiled, not pasted. `pnpm docs:snippets` runs the Angular compiler (strict templates) over this folder
against the real library source, imported by its published name, `angular-movement` — a renamed selector or
input fails the build instead of silently outliving the rename.

- One file per guide. Wrap each example in `// #region doqs:<name>` … `// #endregion doqs:<name>` (outside
  template literals), and name regions `<guide>-<topic>`.
- Not part of the site bundle: nothing imports these files, and `tsconfig.app.json` excludes them.
