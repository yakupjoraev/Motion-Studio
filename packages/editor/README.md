# @motion-studio/editor

The document model in motion: the normalized store, the command set, patch-based history,
selection algebra, and the clipboard.

It manipulates `Node` records described by `schema` and learns about block capabilities through
the injected registry interface, so it is testable in `node` with no React.
