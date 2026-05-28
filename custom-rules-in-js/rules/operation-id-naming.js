/**
 * Custom Rule: Ensure operationId matches the path pattern.
 * e.g. /users -> getUsers, /orders -> getOrders
 * This requires dynamic string manipulation impossible in YAML DSL.
 */
function operationIdNamingRule() {
  return {
    Root(root, ctx) {
      if (!root.paths) return;

      Object.entries(root.paths).forEach(([pathName, pathItem]) => {
        const resourceName = pathName.split('/')[1]; // Get first segment after /
        if (!resourceName) return;

        // PascalCase resource name
        const capitalized = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

        ['get', 'post', 'put', 'delete'].forEach(method => {
          const operation = pathItem[method];
          if (operation && operation.operationId) {
            const expectedPrefix = method === 'get' ? 'get' : method; // simplified logic
            const expectedId = `${method}${capitalized}`;
            
            if (operation.operationId.toLowerCase() !== expectedId.toLowerCase()) {
              ctx.report({
                message: `Naming Standard: For path ${pathName}, the ${method} operationId should be '${expectedId}', but found '${operation.operationId}'.`,
                location: ctx.location.child(['paths', pathName, method, 'operationId']),
              });
            }
          }
        });
      });
    }
  };
}

module.exports = { operationIdNamingRule };
