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
    for (const [fn, baseTypeNames, fieldName, description] of [
      ["ST_3DIntersects", [GEOMETRY], "intersects3D", "Do the Geometries 'spatially intersect' in 3d - only for points, linestrings, polygons, polyhedral surface (area). With SFCGAL backend enabled also supports TINS."],
      ["ST_Contains", [GEOMETRY], "contains", "If no point in specified Geometry/Geography is outside and at least one point is inside."],
      ["ST_ContainsProperly", [GEOMETRY], "containsProperly", "If it intersects the interior but not the boundary (or exterior). Nothing can containsProperly itself, but can contain itself."],
      ["ST_CoveredBy", [GEOMETRY, GEOGRAPHY], "coveredBy", "If no point in field Geometry/Geography is outside specified."],
      ["ST_Covers", [GEOMETRY, GEOGRAPHY], "covers", "If no point is outside."],
      ["ST_Crosses", [GEOMETRY], "crosses", "If there are some, but not all, interior points in common."],
      ["ST_Disjoint", [GEOMETRY], "disjoint", "If they do not share any space together."],
      ["ST_Equals", [GEOMETRY], "equals", "If they represent the same geometry. Directionality is ignored."],
      ["ST_Intersects", [GEOMETRY, GEOGRAPHY], "intersects", "If they share any portion of space (in 2d)."],
      ["ST_OrderingEquals", [GEOMETRY], "orderingEquals", "If they represent the same geometry and points are in the same directional order."],
      ["ST_Overlaps", [GEOMETRY], "overlaps", "If they share space, are of the same dimension, but are not completely contained by each other."],
      ["ST_Touches", [GEOMETRY], "touches", "If they have at least one point in common, but their interiors do not intersect."],
      ["ST_Within", [GEOMETRY], "within", "If the geometry field is completely inside specified."],
    ]) {
      for (const baseTypeName of baseTypeNames) {
        const sqlGisFunction =
          pgGISExtension.namespaceName === "public"
            ? sql.identifier(fn.toLowerCase())
            : sql.identifier(pgGISExtension.namespaceName, fn.toLowerCase());
        specs.push({
          fieldName,
          description,
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
    for (const [op, baseTypeNames, fieldName, description] of [
      ["=", [GEOMETRY, GEOGRAPHY], "exactlyEquals", "If the coordinates and coordinate order geometry/geography are the same ."],
      ["&&", [GEOMETRY, GEOGRAPHY], "bboxIntersects2D", "If 2D bounding boxes intersect each other."],
      ["&&&", [GEOMETRY], "bboxIntersectsND", "If the coordinates and coordinate order geometry/geography are the same."],
      ["&<", [GEOMETRY], "bboxOverlapsOrLeftOf", "If the bounding box overlaps or is to the left of specified."],
      ["&<|", [GEOMETRY], "bboxOverlapsOrBelow", "If the bounding box overlaps or is below specified."],
      ["&>", [GEOMETRY], "bboxOverlapsOrRightOf", "If the bounding box overlaps or is to the right of specified."],
      ["|&>", [GEOMETRY], "bboxOverlapsOrAbove", "If the bounding box overlaps or is above specified."],
      ["<<", [GEOMETRY], "bboxLeftOf", "If the bounding box is strictly to the left of specified."],
      ["<<|", [GEOMETRY], "bboxBelow", "If the bounding box is strictly below specified."],
      [">>", [GEOMETRY], "bboxRightOf", "If the bounding box is strictly to the right of specified."],
      ["|>>", [GEOMETRY], "bboxAbove", "If the bounding box is strictly above specified."],
      ["~", [GEOMETRY], "bboxContains", "If the bounding box contains specified."],
      ["~=", [GEOMETRY], "bboxEquals", "If the bounding box is the same as specified."],
    ]) {
      for (const baseTypeName of baseTypeNames) {
        specs.push({
          fieldName,
          description,
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
