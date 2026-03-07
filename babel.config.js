module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@screens': './src/screens',
            '@components': './src/components',
            '@services': './src/services',
            '@navigation': './src/navigation',
            '@types': './src/types',
            '@hooks': './src/hooks',
            '@constants': './src/constants',
            '@utils': './src/utils',
            '@store': './src/store',
          },
        },
      ],
    ],
  };
};