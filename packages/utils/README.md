# @motion-studio/utils

Pure helpers with zero internal dependencies: `cn`, the assertion family, the `Result` type and the
error hierarchy, id generation, range maths, rect geometry, path access into the document model,
string casing, OKLCH colour maths, the nested radius rule, and a typed `structuredClone`.

Anything in the workspace may depend on this package. It depends on nothing internal, which is what
keeps it testable in `node` and safe to import from any layer. Its only external dependencies are
`clsx` and `tailwind-merge`, both used by `cn` alone.
