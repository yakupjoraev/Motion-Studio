# @motion-studio/codegen

The export engine: the intermediate representation built from a document, the React, Next, HTML,
and JSON printers, and the formatter that runs over their output.

All naming, hoisting, dedupe, and import collection happen once in the IR, so a printer only
serialises.
