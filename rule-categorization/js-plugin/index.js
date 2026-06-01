module.exports = {
  id: 'demo-categories',
  rules: {
    oas3: {
      'operation-risk-tier': () => ({
        Operation: {
          enter(operation, context) {
            if (!operation['x-risk-tier']) {
              context.report({
                message: 'Operations must declare x-risk-tier.',
              });
            }
          },
        },
      }),
    },
    oas3_1: {
      'operation-risk-tier': () => ({
        Operation: {
          enter(operation, context) {
            if (!operation['x-risk-tier']) {
              context.report({
                message: 'Operations must declare x-risk-tier.',
              });
            }
          },
        },
      }),
    },
  },
};
