function paginationRangeRule() {
  return {
    Operation: {
      enter(operation, ctx) {
        const params = operation.parameters || [];
        const limitParam = params.find(param => param.name === 'limit' && param.in === 'query');
        const offsetParam = params.find(param => param.name === 'offset' && param.in === 'query');

        if (!limitParam || !offsetParam) return;

        const limitValue = limitParam.schema?.default || 0;
        const offsetValue = offsetParam.schema?.default || 0;

        if (limitValue + offsetValue <= 1000) return;

        ctx.report({
          message: `Complex Validation: The sum of default limit (${limitValue}) and offset (${offsetValue}) exceeds the corporate safety threshold of 1000.`,
          location: ctx.location.child('parameters'),
        });
      },
    },
  };
}

module.exports = { paginationRangeRule };
