module.exports = function PgConnectionArgFilterPostgisOperatorsPlugin(builder) {
  builder.hook("init", (_, build) => {
    const {
      addConnectionFilterOperator,
      inflection,
      pgSql: sql,
      pgGISExtension,
      pgGISGeographyType,
      pgGISGeometryType,
    } = build;

    if (!pgGISExtension || !pgGISGeographyType || !pgGISGeometryType) {
      return _;
    }

    const GEOGRAPHY = pgGISGeographyType.name;
    const GEOMETRY = pgGISGeometryType.name;

    const gqlTypeNamesByGisBaseTypeName = {
      geography: [0, 1, 2, 3, 4, 5, 6, 7].map(subtype =>
        inflection.gisType(pgGISGeographyType, subtype)
      ),
      geometry: [0, 1, 2, 3, 4, 5, 6, 7].map(subtype =>
        inflection.gisType(pgGISGeometryType, subtype)
      ),
    };

    let specs = [];

    // Functions
    for (const [fn, baseTypeNames, fieldName] of [
      ["ST_3DIntersects", [GEOMETRY], "intersects3D"],
      ["ST_Contains", [GEOMETRY], "contains"],
      ["ST_ContainsProperly", [GEOMETRY], "containsProperly"],
      ["ST_CoveredBy", [GEOMETRY, GEOGRAPHY], "coveredBy"],
      ["ST_Covers", [GEOMETRY, GEOGRAPHY], "covers"],
      ["ST_Crosses", [GEOMETRY], "crosses"],
      ["ST_Disjoint", [GEOMETRY], "disjoint"],
      ["ST_Equals", [GEOMETRY], "equals"],
      ["ST_Intersects", [GEOMETRY, GEOGRAPHY], "intersects"],
      ["ST_OrderingEquals", [GEOMETRY], "orderingEquals"],
      ["ST_Overlaps", [GEOMETRY], "overlaps"],
      ["ST_Touches", [GEOMETRY], "touches"],
      ["ST_Within", [GEOMETRY], "within"],
    ]) {
      for (const baseTypeName of baseTypeNames) {
        const sqlGisFunction =
          pgGISExtension.namespaceName === "public"
            ? sql.identifier(fn.toLowerCase())
            : sql.identifier(pgGISExtension.namespaceName, fn.toLowerCase());
        specs.push({
          fieldName,
          description: `Matches the specified ${baseTypeName} using the \`${fn}\` function.`,
          resolveType: fieldType => fieldType,
          resolve: (i, v) => sql.query`${sqlGisFunction}(${i}, ${v})`,
          options: {
            allowedFieldTypes: gqlTypeNamesByGisBaseTypeName[baseTypeName],
            allowedListTypes: ["NonList"],
          },
        });
      }
    }

    // Operators
    for (const [op, baseTypeNames, fieldName] of [
      ["=", [GEOMETRY, GEOGRAPHY], "exactlyEquals"],
      ["&&", [GEOMETRY, GEOGRAPHY], "bboxIntersects2D"],
      ["&&&", [GEOMETRY], "bboxIntersectsND"],
      ["&<", [GEOMETRY], "bboxOverlapsOrLeftOf"],
      ["&<|", [GEOMETRY], "bboxOverlapsOrBelow"],
      ["&>", [GEOMETRY], "bboxOverlapsOrRightOf"],
      ["|&>", [GEOMETRY], "bboxOverlapsOrAbove"],
      ["<<", [GEOMETRY], "bboxLeftOf"],
      ["<<|", [GEOMETRY], "bboxBelow"],
      [">>", [GEOMETRY], "bboxRightOf"],
      ["|>>", [GEOMETRY], "bboxAbove"],
      ["~", [GEOMETRY], "bboxContains"],
      ["~=", [GEOMETRY], "bboxEquals"],
    ]) {
      for (const baseTypeName of baseTypeNames) {
        specs.push({
          fieldName,
          description: `Matches the specified ${baseTypeName} using the \`${op}\` operator.`,
          resolveType: fieldType => fieldType,
          resolve: (i, v) => sql.query`${i} ${sql.raw(op)} ${v}`,
          options: {
            allowedFieldTypes: gqlTypeNamesByGisBaseTypeName[baseTypeName],
            allowedListTypes: ["NonList"],
          },
        });
      }
    }

    specs.sort((a, b) => (a.fieldName > b.fieldName ? 1 : -1));

    specs.forEach(
      ({ fieldName, description, resolveType, resolve, options }) => {
        addConnectionFilterOperator(
          fieldName,
          description,
          resolveType,
          resolve,
          options
        );
      }
    );

    return _;
  });
};
