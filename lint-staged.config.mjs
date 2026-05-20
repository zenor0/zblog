const lintStagedConfig = {
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['eslint --fix', 'prettier --write'],
  '*.{json,jsonc,md,mdx,css,scss,yml,yaml}': 'prettier --write',
}

export default lintStagedConfig
