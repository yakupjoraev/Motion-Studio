# @motion-studio/schema

Zod schemas and the types inferred from them: the document model, the `.motion` file format and
its migrations, and the `BlockDefinition` / `BlockRegistry` interface that separates the editor
from the blocks.

The registry seam lives here so `editor`, `canvas`, and `codegen` never import `blocks`.
