# @motion-studio/utils

Pure helpers with zero internal dependencies: `cn`, `assertNever`, id generation, clamping and
range maths, the `Result` type, and the error hierarchy.

Anything in the workspace may depend on this package. It depends on nothing, which is what keeps
it testable in `node` and safe to import from any layer.
