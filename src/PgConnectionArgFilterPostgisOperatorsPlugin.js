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
      ["ST_3DIntersects", [GEOMETRY], "intersects3D", "Returns TRUE if the Geometries 'spatially intersect' in 3d - only for points, linestrings, polygons, polyhedral surface (area). With SFCGAL backend enabled also supports TINS."],
      ["ST_Contains", [GEOMETRY], "contains", "Returns TRUE if and only if no points of supplied lie in the exterior of field, and at least one point of the interior of supplied lies in the interior of field."],
      ["ST_ContainsProperly", [GEOMETRY], "containsProperly", "Returns TRUE if supplied intersects the interior of field but not the boundary (or exterior). Field does not contain properly itself, but does contain itself."],
      ["ST_CoveredBy", [GEOMETRY, GEOGRAPHY], "coveredBy", "Returns TRUE if no point in field Geometry/Geography is outside supplied Geometry/Geography."],
      ["ST_Covers", [GEOMETRY, GEOGRAPHY], "covers", "Returns TRUE if no point in supplied Geometry is outside field Geometry."],
      ["ST_Crosses", [GEOMETRY], "crosses", "Returns TRUE if the supplied geometries have some, but not all, interior points in common."],
      ["ST_Disjoint", [GEOMETRY], "disjoint", "Returns TRUE if the Geometries do not 'spatially intersect' - if they do not share any space together."],
      ["ST_Equals", [GEOMETRY], "equals", "Returns TRUE if the given geometries represent the same geometry. Directionality is ignored."],
      ["ST_Intersects", [GEOMETRY, GEOGRAPHY], "intersects", "Returns TRUE if the Geometries/Geography 'spatially intersect in 2D' - (share any portion of space)."],
      ["ST_OrderingEquals", [GEOMETRY], "orderingEquals", "Returns TRUE if the given geometries represent the same geometry and points are in the same directional order."],
      ["ST_Overlaps", [GEOMETRY], "overlaps", "Returns TRUE if the Geometries share space, are of the same dimension, but are not completely contained by each other."],
      ["ST_Touches", [GEOMETRY], "touches", "Returns TRUE if the geometries have at least one point in common, but their interiors do not intersect."],
      ["ST_Within", [GEOMETRY], "within", "Returns TRUE if the geometry field is completely inside geometry supplied"],
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
      ["=", [GEOMETRY, GEOGRAPHY], "exactlyEquals", "Returns TRUE if the coordinates and coordinate order geometry/geography field are the same as the coordinates and coordinate order of geometry/geography supplied."],
      ["&&", [GEOMETRY, GEOGRAPHY], "bboxIntersects2D", "Returns TRUE if fields's 2D bounding box intersects supplied's 2D bounding box."],
      ["&&&", [GEOMETRY], "bboxIntersectsND", "Returns TRUE if the coordinates and coordinate order geometry/geography field are the same as the coordinates and coordinate order of geometry/geography supplied."],
      ["&<", [GEOMETRY], "bboxOverlapsOrLeftOf", "Returns TRUE if field's bounding box overlaps or is to the left of supplied's."],
      ["&<|", [GEOMETRY], "bboxOverlapsOrBelow", "Returns TRUE if field's bounding box overlaps or is below supplied's."],
      ["&>", [GEOMETRY], "bboxOverlapsOrRightOf", "Returns TRUE if field's bounding box overlaps or is to the right of supplied's."],
      ["|&>", [GEOMETRY], "bboxOverlapsOrAbove", "Returns TRUE if field's bounding box overlaps or is above supplied's."],
      ["<<", [GEOMETRY], "bboxLeftOf", "Returns TRUE if field's bounding box is strictly to the left of supplied's."],
      ["<<|", [GEOMETRY], "bboxBelow", "Returns TRUE if field's bounding box is strictly below supplied's."],
      [">>", [GEOMETRY], "bboxRightOf", "Returns TRUE if field's bounding box is strictly to the right of supplied's."],
      ["|>>", [GEOMETRY], "bboxAbove", "Returns TRUE if field's bounding box is strictly above supplied's."],
      ["~", [GEOMETRY], "bboxContains", "Returns TRUE if field's bounding box contains supplied's."],
      ["~=", [GEOMETRY], "bboxEquals", "Returns TRUE if field's bounding box is the same as supplied's."],
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
