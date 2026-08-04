# @motion-studio/blocks

The component registry: the blocks a user places on the canvas, each with its Zod props schema,
defaults, slots, capabilities, and codegen descriptor.

A block is a pure presentational component of its props. It never imports `editor`, which is what
lets the same component render in the canvas and in the exported app.
