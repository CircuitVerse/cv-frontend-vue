#!/bin/sh

if [ ! -L v0/src ] || [ ! -e v0/src ]; then
  echo "warning: v0/src is not a symlink, v0 will fail to load its source."
  echo "See the Windows prerequisites section in README.md, then re-clone the repository."
fi

npm ci
