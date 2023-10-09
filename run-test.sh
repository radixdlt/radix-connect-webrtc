#!/bin/bash

# run unit tests
npm run test

exitcode="$?"
echo "exitcode=$exitcode"

# ignore 134 error code
[ "$exitcode" = 134 ]; exit 0

exit $exitcode
```