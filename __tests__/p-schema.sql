create extension if not exists postgis;

drop schema if exists p cascade;

create schema p;

create table p.gis_debug (
  id                        serial primary key,

  geog                      geography,

  geog_point                geography(point),
  geog_linestr              geography(linestring),
  geog_poly                 geography(polygon),
  geog_multipoint           geography(multipoint),
  geog_multilinestr         geography(multilinestring),
  geog_multipoly            geography(multipolygon),
  geog_geometrycollection   geography(geometrycollection),

  geog_pointm               geography(pointm),
  geog_linestrm             geography(linestringm),
  geog_polym                geography(polygonm),
  geog_multipointm          geography(multipointm),
  geog_multilinestrm        geography(multilinestringm),
  geog_multipolym           geography(multipolygonm),
  geog_geometrycollectionm  geography(geometrycollectionm),

  -- geog_pointz               geography(point),
  -- geog_linestrz             geography(linestring),
  -- geog_polyz                geography(polygon),
  -- geog_multipointz          geography(multipoint),
  -- geog_multilinestrz        geography(multilinestring),
  -- geog_multipolyz           geography(multipolygon),
  -- geog_geometrycollectionz  geography(geometrycollection),

  -- geog_pointmz              geography(pointm),
  -- geog_linestrmz            geography(linestringm),
  -- geog_polymz               geography(polygonm),
  -- geog_multipointmz         geography(multipointm),
  -- geog_multilinestrmz       geography(multilinestringm),
  -- geog_multipolymz          geography(multipolygonm),
  -- geog_geometrycollectionmz geography(geometrycollectionm),

  geom                      geometry,

  geom_point                geometry(point),
  geom_linestr              geometry(linestring),
  geom_poly                 geometry(polygon),
  geom_multipoint           geometry(multipoint),
  geom_multilinestr         geometry(multilinestring),
  geom_multipoly            geometry(multipolygon),
  geom_geometrycollection   geometry(geometrycollection),

  geom_pointm               geometry(pointm),
  geom_linestrm             geometry(linestringm),
  geom_polym                geometry(polygonm),
  geom_multipointm          geometry(multipointm),
  geom_multilinestrm        geometry(multilinestringm),
  geom_multipolym           geometry(multipolygonm),
  geom_geometrycollectionm  geometry(geometrycollectionm)

  -- geom_pointz               geometry(point),
  -- geom_linestrz             geometry(linestring),
  -- geom_polyz                geometry(polygon),
  -- geom_multipointz          geometry(multipoint),
  -- geom_multilinestrz        geometry(multilinestring),
  -- geom_multipolyz           geometry(multipolygon),
  -- geom_geometrycollectionz  geometry(geometrycollection),

  -- geom_pointmz              geometry(pointm),
  -- geom_linestrmz            geometry(linestringm),
  -- geom_polymz               geometry(polygonm),
  -- geom_multipointmz         geometry(multipointm),
  -- geom_multilinestrmz       geometry(multilinestringm),
  -- geom_multipolymz          geometry(multipolygonm),
  -- geom_geometrycollectionmz geometry(geometrycollectionm),
);