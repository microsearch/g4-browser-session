#! /bin/bash

# relies on g4api-ts being a sibling of this directory
pushd ../g4api-ts
npm run generate-local
popd

\cp -rv ../g4api-ts/* ./node_modules/g4api-ts
npm run build
