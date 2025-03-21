#!/bin/bash
# 确保CI=false设置被应用
export CI=false
export ESLINT_NO_DEV_ERRORS=true

# 运行构建命令
npm run build 