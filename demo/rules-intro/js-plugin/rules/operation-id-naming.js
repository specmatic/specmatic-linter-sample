function operationIdNamingRule() {
  return {
    Root(root, ctx) {
      if (!root.paths) return;

      Object.entries(root.paths).forEach(([pathName, pathItem]) => {
        const resourceName = pathName.split('/')[1];
        if (!resourceName) return;

        const capitalized = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

        ['get', 'post', 'put', 'delete'].forEach(method => {
          const operation = pathItem[method];
          if (!operation || !operation.operationId) return;

          const expectedId = `${method}${capitalized}`;
          if (operation.operationId.toLowerCase() === expectedId.toLowerCase()) return;

          ctx.report({
            message: `Naming Standard: For path ${pathName}, the ${method} operationId should be '${expectedId}', but found '${operation.operationId}'.`,
            location: ctx.location.child(['paths', pathName, method, 'operationId']),
          });
        });
      });
    },
  };
}

module.exports = { operationIdNamingRule };
