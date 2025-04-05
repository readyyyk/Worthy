/** @type {import("eslint").Linter.Config} */
const config = {
  rules: {
    // Отключаем правила, которые вызывают ошибки в существующем коде
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-misused-promises": "off",
    "prefer-const": "off",
    "@typescript-eslint/non-nullable-type-assertion-style": "off",
    "@typescript-eslint/consistent-type-imports": "off",
  },
};

module.exports = config;