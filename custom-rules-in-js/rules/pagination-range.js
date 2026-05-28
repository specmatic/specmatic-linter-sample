/**
 * Custom Rule: Ensure that if both 'limit' and 'offset' query parameters exist,
 * their combined default value or maximum doesn't exceed 1000.
 */
function paginationRangeRule() {
  return {
    Operation: {
      enter(operation, ctx) {
        const params = operation.parameters || [];
        const limitParam = params.find(p => p.name === 'limit' && p.in === 'query');
        const offsetParam = params.find(p => p.name === 'offset' && p.in === 'query');

        if (limitParam && offsetParam) {
          const limitValue = limitParam.schema?.default || 0;
          const offsetValue = offsetParam.schema?.default || 0;

          if (limitValue + offsetValue > 1000) {
            ctx.report({
              message: `Complex Validation: The sum of default limit (${limitValue}) and offset (${offsetValue}) exceeds the corporate safety threshold of 1000.`,
              location: ctx.location.child('parameters'),
            });
          }
        }
      }
    }
  };
}

module.exports = { paginationRangeRule };
