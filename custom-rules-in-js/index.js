const { paginationRangeRule } = require('./rules/pagination-range');
const { operationIdNamingRule } = require('./rules/operation-id-naming');

module.exports = {
  id: 'corp-standards',
  rules: {
    oas3: {
      'pagination-range': paginationRangeRule,
      'operation-id-naming': operationIdNamingRule,
    },
    oas3_1: {
      'pagination-range': paginationRangeRule,
      'operation-id-naming': operationIdNamingRule,
    },
  },
};
