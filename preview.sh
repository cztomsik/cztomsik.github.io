#!/bin/sh

# download hugo if not exists
if [ ! -f hugo ]; then
    brew install hugo
fi

# run hugo server
hugo server
