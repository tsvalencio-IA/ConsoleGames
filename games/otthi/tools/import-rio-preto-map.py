#!/usr/bin/env python3
"""Build the playable São José do Rio Preto map from public OSM .osm extracts.

Usage: python tools/import-rio-preto-map.py DIRECTORY
Import dependency: shapely 2.1.2. The game uses the resulting static JSON offline.
"""
import argparse
import json
import math
import re
from pathlib import Path
import xml.etree.ElementTree as ET

from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import nearest_points, polygonize, unary_union
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = (-20.811, -49.378)
METERS_PER_LATITUDE_DEGREE = 111_195.08
METERS_PER_LONGITUDE_DEGREE = METERS_PER_LATITUDE_DEGREE * math.cos(math.radians(ORIGIN[0]))
LIMITS = (-49.4145, -20.849, -49.3465, -20.774)
CAR_ROADS = {
    "motorway": 8.0, "trunk": 8.0, "primary": 8.2, "secondary": 7.3,
    "tertiary": 6.4, "unclassified": 5.8, "residential": 5.7, "living_street": 4.0,
    "service": 3.1, "track": 2.6, "road": 5.0
}
FOOTWAYS = {"footway", "pedestrian", "path", "cycleway", "steps"}
WATER_RELATIONS = {2535587, 5735705, 5735704}

# The named set always has a purpose in the game. Registry references distinguish
# an OSM footprint from an address pin with an illustrative floor plan.
SITES = {
    "mercado_municipal": {"ref": "w364259959", "kind": "market", "street": "Rua Antônio de Godoy"},
    "catedral_sao_jose": {"ref": "w1494592063", "kind": "church", "street": "Rua Siqueira Campos", "ratio": .88},
    "prefeitura_andalo": {"ref": "w259757137", "kind": "civic", "street": "Avenida Doutor Alberto Andaló", "ratio": .69},
    "calcadao_centro": {"ref": "w222566090", "kind": "square", "name": "Calçadão · Praça Dom José Marcondes", "size": [13, 9]},
    "mcdonalds_andalo": {"ref": "r9938210", "kind": "dining", "street": "Avenida Doutor Alberto Andaló", "ratio": .69},
    "complexo_swift": {"ref": "w515051094", "kind": "theater", "street": "Avenida Duque de Caxias", "ratio": .53},
    "dona_capi": {"ref": "n13740699640", "kind": "statue", "size": [3, 3]},
    "canecao_represa": {"at": [-20.8063058, -49.3618643], "kind": "dining", "size": [23, 15], "street": "Avenida Lino José de Seixas", "source": "https://ranklevel.com.br/empresa/sao-jose-do-rio-preto/canecao-represa/"},
    "posto_brasilia": {"at": [-20.8027913, -49.3591136], "kind": "fuel", "size": [24, 18], "street": "Avenida Doutor Fernando Costa", "source": "https://www.waze.com/live-map/directions/br/sp/posto-chiesa-brasilia?to=place.ChIJJ8vfA65SvJQRXMHAAxBSIYQ"},
    "estadio_teixeirao": {"ref": "w161299822", "kind": "stadium", "street": "Avenida Doutor Antônio Tavares Pereira Lima", "size": [62, 43], "name": "Teixeirão · Estádio Benedito Teixeira"},
    "estadio_anisio_haddad": {"ref": "w156730895", "kind": "practice", "size": [62, 42]},
    "riopreto_shopping": {"ref": "w227731153", "kind": "mall", "street": "Avenida Brigadeiro Faria Lima", "ratio": .47},
    "plaza_avenida": {"ref": "w227729498", "kind": "mall", "street": "Avenida José Munia", "ratio": .51},
    "centro_eventos": {"ref": "w385498301", "kind": "exhibition", "street": "Avenida José Munia", "ratio": .58},
    "austa_hospital": {"ref": "w493492009", "kind": "reception", "street": "Avenida Murchid Homsi", "ratio": .44},
    "cemiterio_sao_joao_batista": {"ref": "w156745297", "kind": "garden", "size": [8, 6], "street": "Avenida Professor Francisco Barbeta Junior"},
    "parque-da-represa": {"ref": "n4942615978", "kind": "trail", "size": [8, 4], "name": "Parque da Represa Municipal"},
    "panificacao-zappas-centro": {"ref": "w1123192463", "kind": "bakery", "name": "Zappa’s · unidade do Centro", "ratio": .84},
    "terminal-urbano": {"ref": "r10789981", "kind": "station", "name": "Terminal Urbano", "ratio": .41},
    "upa-jaguare": {"ref": "w1190042324", "kind": "reception", "name": "UPA Jaguaré", "ratio": .80},
    "aeroporto-sbsr": {"ref": "w424901184", "kind": "airport", "name": "Aeroporto Prof. Eribelto Manoel Reino", "ratio": .71, "street": "Avenida dos Estudantes"},
    "cachoeira_troca_oleo": {"at": [-20.779792, -49.4043916], "kind": "oil-shop", "size": [13, 9], "street": "Rua Antoninho da Rocha Marmo", "source": "https://www.waze.com/live-map/directions/brazil/state-of-sao-paulo/sao-jose-do-rio-preto/cachoeira-super-troca-de-oleo?to=place.ChIJwx_AehOtvZQRzirbDhrtkXE"},
}

RESIDENCES = [
    ("casa-jardim", "Casa do Jardim · Teixeira de Freitas", "home", 905.0, 66.0, 9.3, 7.2, 0.0, 0, "popular"),
    ("casa-cotegipe", "Casa de varanda · Barão de Cotegipe", "blue", 852.4, 68.5, 10.5, 7.6, math.pi, 380, "popular"),
    ("casa-vila-ercilia", "Casa térrea · Vila Ercília", "pink", 877.0, 66.0, 9.5, 7.5, -math.pi/2, 450, "popular"),
    ("casa-damha", "Casa contemporânea · Damha", "cabin", 3147.5, 237.6, 16.0, 10.2, math.pi/2, 1250, "damha"),
    ("casa-damha-varanda", "Casa com varanda · Damha", "rio-damha-varanda", 3169.4, 147.5, 15.2, 10.9, 0.0, 1490, "damha"),
]


def tags(element):
    return {tag.attrib["k"]: tag.attrib["v"] for tag in element.findall("tag")}


def point(lat, lon):
    return (round((float(lon) - ORIGIN[1]) * METERS_PER_LONGITUDE_DEGREE, 2),
            round((ORIGIN[0] - float(lat)) * METERS_PER_LATITUDE_DEGREE, 2))


def closed_polygon(points):
    if len(points) < 4 or points[0] != points[-1]:
        return Polygon()
    return Polygon(points).buffer(0)


def polygon_parts(geometry):
    if geometry.is_empty:
        return []
    if geometry.geom_type == "Polygon":
        return [geometry]
    if hasattr(geometry, "geoms"):
        return [part for piece in geometry.geoms for part in polygon_parts(piece)]
    return []


def rounded_ring(coords):
    return [[round(x, 2), round(z, 2)] for x, z in list(coords)[:-1]]


def rings(poly):
    return [rounded_ring(poly.exterior.coords), *(rounded_ring(h.coords) for h in poly.interiors)]


def road_width(data):
    kind = data["highway"]
    width = CAR_ROADS.get(kind.removesuffix("_link"), 2.1 if kind in FOOTWAYS else 3.8)
    single = data.get("oneway") in {"yes", "-1", "1", "true"}
    if kind in CAR_ROADS or kind.endswith("_link"):
        if single:
            width = (6.6 if kind in {"trunk", "motorway", "primary"} else 3.9)
        try:
            width = max(width, int(data.get("lanes", 0)) * 2.9)
        except ValueError:
            pass
    match = re.fullmatch(r"([0-9]+(?:[.,][0-9]+)?)(?:\s*m)?", data.get("width", ""))
    if match:
        width = min(20, max(1.2, float(match[1].replace(",", "."))))
    return round(width, 2)


def read_elements(directory):
    tables = {"node": {}, "way": {}, "relation": {}}
    boxes = []
    for file in sorted(directory.glob("*.osm")):
        tree = ET.parse(file)
        bounds = tree.getroot().find("bounds")
        if bounds is not None:
            boxes.append({k: float(v) for k, v in bounds.attrib.items()})
        for item in tree.getroot():
            if item.tag in tables:
                tables[item.tag][int(item.attrib["id"])] = item
    return tables, boxes


def import_map(directory):
    tables, boxes = read_elements(directory)
    raw_nodes, ways, relations = [tables[k] for k in ("node", "way", "relation")]
    coords = {ident: point(n.attrib["lat"], n.attrib["lon"]) for ident, n in raw_nodes.items()}

    def points_of(way):
        return [coords[int(node.attrib["ref"])] for node in way.findall("nd") if int(node.attrib["ref"]) in coords]

    def way_polygon(ident):
        return closed_polygon(points_of(ways[ident]))

    def relation_polygon(ident):
        outer, inner = [], []
        for member in relations[ident].findall("member"):
            if member.attrib.get("type") != "way" or int(member.attrib["ref"]) not in ways:
                continue
            points = points_of(ways[int(member.attrib["ref"])])
            if len(points) > 1:
                (inner if member.get("role") == "inner" else outer).append(LineString(points))
        return unary_union(list(polygonize(outer))).difference(unary_union(list(polygonize(inner))))

    west, south, east, north = LIMITS
    min_x, min_z = point(north, west)
    max_x, max_z = point(south, east)
    area = box(min_x, min_z, max_x, max_z)
    node_indices, road_nodes, roads, drive_lines, public_lines = {}, [], [], [], []
    road_patches, foot_lines = [], []
    for ident, way in sorted(ways.items()):
        data = tags(way)
        kind = data.get("highway", "")
        ped = kind in FOOTWAYS
        if not (ped or kind in CAR_ROADS or kind.endswith("_link")) or data.get("area") == "yes" or data.get("tunnel") == "yes":
            continue
        # Private service roads remain visible, and are excluded from trip routing.
        access = data.get("motor_vehicle", data.get("access", ""))
        private = access in {"no", "private", "customers", "delivery"}
        refs = [int(node.attrib["ref"]) for node in way.findall("nd") if int(node.attrib["ref"]) in coords]
        if data.get("oneway") == "-1":
            refs.reverse()
        width = road_width(data)
        bridge = data.get("bridge") not in {None, "no"}
        if len(refs) < 2 or not LineString([coords[n] for n in refs]).intersects(area):
            continue
        spans, span = [], []
        for ref in refs:
            x, z = coords[ref]
            if x < min_x - 160 or x > max_x + 160 or z < min_z - 160 or z > max_z + 160:
                if len(span) > 1:
                    spans.append(span)
                span = []
                continue
            span.append(ref)
        if len(span) > 1:
            spans.append(span)
        for span in spans:
            indices = []
            for ref in span:
                if ref not in node_indices:
                    node_indices[ref] = len(road_nodes)
                    road_nodes.append(list(coords[ref]))
                indices.append(node_indices[ref])
            oneway = data.get("oneway") in {"yes", "-1", "1", "true"} or data.get("junction") == "roundabout"
            name = data.get("name", "")
            roads.append([ident, kind, width, name, int(oneway), int(bridge), int(private), indices])
            line = LineString([coords[ref] for ref in span])
            if ped:
                if not private and kind != "steps":
                    foot_lines.append((ident, line))
            else:
                drive_lines.append((ident, name, width, line))
                if not private:
                    public_lines.append((ident, name, width, line))
                road_patches.append(line.buffer(width / 2 + .25, cap_style="flat"))

    drive_tree = STRtree([entry[3] for entry in drive_lines])
    road_buffers = STRtree(road_patches)
    foot_tree = STRtree([part[1] for part in foot_lines])
    public_tree = STRtree([entry[3] for entry in public_lines])
    water_geometry = {ident: relation_polygon(ident) for ident in sorted(WATER_RELATIONS) if ident in relations}
    water = unary_union(list(water_geometry.values())).intersection(area)
    reserve_shape = water.buffer(.36)

    def nearest_public(anchor, street=None):
        candidates = public_tree.query(anchor.buffer(240))
        by_name = [int(i) for i in candidates if street and public_lines[i][1].casefold() == street.casefold()]
        pool = by_name or [int(i) for i in candidates]
        return min((public_lines[i] for i in pool), key=lambda row: row[3].distance(anchor)) if pool else public_lines[int(public_tree.nearest(anchor))]

    catalog_text = (ROOT / "src/modules/83-rio-v51-layout.js").read_text()
    names = {m[0]: m[1] for m in re.findall(r'^\s*\["([^"]+)", "([^"]+?)(?<!\\)"', catalog_text, re.M)}
    names["mercado_municipal"] = "Mercado Municipal · Mercadão"
    points = []
    stashed_sources = set()
    for key, spec in SITES.items():
        kind, ref = spec["kind"], spec.get("ref", "")
        shape = Polygon()
        if ref.startswith("w"):
            ident = int(ref[1:])
            shape = way_polygon(ident)
            element = ways[ident]
            stashed_sources.add(ident)
        elif ref.startswith("r"):
            ident = int(ref[1:])
            shape = relation_polygon(ident)
            element = relations[ident]
            stashed_sources |= {int(m.get("ref")) for m in element.findall("member") if m.get("type") == "way"}
        elif ref.startswith("n"):
            ident = int(ref[1:])
            element = raw_nodes[ident]
        else:
            element = None
        name = spec.get("name") or names.get(key) or tags(element).get("name") or key
        anchor = Point(point(*spec["at"])) if "at" in spec else shape.centroid if not shape.is_empty else Point(coords[ident])
        if kind in {"square", "garden", "trail"} and not shape.is_empty:
            anchor = shape.representative_point()
        shape_derived = bool(not shape.is_empty and spec.get("size") is None)
        road_id, road_name, width, road = nearest_public(anchor, spec.get("street"))
        if kind == "garden":
            border, roadside = nearest_points(shape.boundary, road)
            vx, vz = anchor.x - border.x, anchor.y - border.y
            distance = math.hypot(vx, vz)
            anchor = Point(border.x + vx / distance * 5.5, border.y + vz / distance * 5.5)
        street_point = road.interpolate(road.project(anchor))
        yaw = math.atan2(street_point.x - anchor.x, street_point.y - anchor.y)
        if kind == "oil-shop":
            w,d = spec["size"]
            distance = road.project(anchor)
            before,after = road.interpolate(distance-1),road.interpolate(distance+1)
            angle = math.atan2(after.x-before.x,after.y-before.y)+math.pi/2
            choices = []
            for along in (0,-5,5,-10,10,-17,17):
                adjacent = road.interpolate(max(0,distance+along))
                for sign in (1,-1):
                    for extra in (3.5,5.5,8.5,12.5):
                        gap = width/2+d/2+extra
                        x,z = adjacent.x+sign*math.sin(angle)*gap,adjacent.y+sign*math.cos(angle)*gap
                        head = math.atan2(adjacent.x-x,adjacent.y-z)
                        candidate = lot_rect(x,z,head,w,d).buffer(.8)
                        if not len(road_buffers.query(candidate,predicate="intersects")):
                            choices.append((Point(x,z).distance(anchor),x,z,head))
            if choices:
                _,x,z,yaw = min(choices)
                anchor = Point(x,z)
        if shape_derived:
            rect = max(polygon_parts(shape), key=lambda p: p.area).minimum_rotated_rectangle
            edges = list(rect.exterior.coords)
            anchor = rect.centroid
            candidates = []
            for i, (a, b) in enumerate(zip(edges, edges[1:])):
                tangent = math.atan2(b[0] - a[0], b[1] - a[1])
                for normal in (tangent - math.pi / 2, tangent + math.pi / 2):
                    angle = math.atan2(math.sin(normal - yaw), math.cos(normal - yaw))
                    candidates.append((abs(angle), normal, math.dist(a,b), math.dist(b, edges[(i+2) % 4])))
            _, yaw, w, d = min(candidates)
            ratio = spec.get("ratio", .96)
            for _ in range(16):
                trial = lot_rect(anchor.x, anchor.y, yaw, w*ratio, d*ratio)
                if (trial.difference(shape).area <= trial.area * .05 and
                    all(trial.intersection(road_patches[i]).area <= .25 for i in road_buffers.query(trial))):
                    break
                ratio *= .92
            w, d = w*ratio,d*ratio
        else:
            w, d = spec["size"]
        if kind == "stadium":
            # The game pitch uses its existing east/west physics within the actual stadium lot.
            yaw = math.pi
        if kind == "practice":
            yaw = math.pi / 2
        # A protected outline for each interactive site replaces the ambient shell on that lot.
        lot = lot_rect(anchor.x, anchor.y, yaw, w, d)
        nearest_road_bands = [road_patches[i] for i in road_buffers.query(lot.buffer(.7))]
        if kind not in {"statue", "trail", "square", "garden"} and lot.intersects(reserve_shape):
            raise ValueError(f"{key} is in the water")
        if kind not in {"statue", "trail", "square", "garden"} and any(lot.intersection(p).area > .35 for p in nearest_road_bands):
            raise ValueError(f"{key} intrudes into the mapped street")
        entrance = local_xy(anchor.x, anchor.y, yaw,0,d/2+1.1)
        points.append({"id": f"regional-{key.replace('-', '_')}", "key":key,"name":name,"kind":kind,
                       "x":round(anchor.x,2),"z":round(anchor.y,2),"w":round(w,2),"d":round(d,2),
                       "yaw":round(yaw,5),"entry":[round(v,2) for v in entrance],
                       "road":[round(street_point.x,2),round(street_point.y,2)],
                       "street":road_name,"osm":ref,"plan":"mapped-footprint" if shape_derived else "interpretation",
                       "location":[round(ORIGIN[0]-anchor.y/METERS_PER_LATITUDE_DEGREE,7),round(ORIGIN[1]+anchor.x/METERS_PER_LONGITUDE_DEGREE,7)],
                       "source":spec.get("source", f"https://www.openstreetmap.org/{ {'w':'way','n':'node','r':'relation'}[ref[0]] if ref else 'copyright'}/{ref[1:]}" if ref else "https://www.openstreetmap.org/copyright")})
    for key,name,property_id,x,z,w,d,yaw,price,style in RESIDENCES:
        lot = lot_rect(x,z,yaw,w,d)
        if lot.intersects(reserve_shape) or len(road_buffers.query(lot.buffer(.4),predicate="intersects")):
            raise ValueError(f"{key} conflicts with nearby land use")
        _,street,width,road = nearest_public(Point(x,z))
        projection = road.interpolate(road.project(Point(x,z)))
        points.append({"id":"regional-"+key,"key":key,"kind":"residence","name":name,"propertyId":property_id,
                       "price":price,"style":style,"x":x,"z":z,"w":w,"d":d,"yaw":round(yaw,5),
                       "entry":[round(v,2) for v in local_xy(x,z,yaw,0,d/2+1.1)],
                       "road":[round(projection.x,2),round(projection.y,2)],"street":street,"plan":"fictional-residence"})
    build, parks, trail = [], [], []
    used_lots = [lot_rect(p["x"], p["z"], p["yaw"], p["w"]+.15, p["d"]+.15) for p in points]
    lot_index = STRtree(used_lots)
    for ident, way in sorted(ways.items()):
        data = tags(way)
        if not ("building" in data or data.get("leisure") in {"park", "garden", "pitch"}):
            continue
        geom = way_polygon(ident)
        if geom.is_empty or not area.intersects(geom):
            continue
        if data.get("leisure") in {"park", "garden", "pitch"} and "building" not in data:
            for poly in polygon_parts(geom.intersection(area).simplify(.5)):
                if poly.area >= 45:
                    parks.append([ident, data.get("leisure"), rings(poly)])
            continue
        if ident in stashed_sources or data["building"] in {"roof", "construction", "shed"} or geom.area<9:
            continue
        if any(geom.intersection(used_lots[i]).area > .4 for i in lot_index.query(geom)):
            continue
        geometry=geom.intersection(area).difference(water)
        for i in road_buffers.query(geometry):
            geometry=geometry.difference(road_patches[i])
        # A mapped footprint that conflicts badly with estimated carriageway widths
        # stays empty until it can be reconciled, keeping all sidewalks usable.
        if geometry.area < geom.area*.80:
            continue
        for poly in polygon_parts(geometry.simplify(.16,preserve_topology=True)):
            if poly.area<9:
                continue
            floors = float(data["building:levels"]) if re.fullmatch(r"[0-9]+(?:\.[0-9]+)?",data.get("building:levels","")) else 1
            height = min(45, max(2.8, floors*3.25+(ident%7)*.09))
            if re.fullmatch(r"[0-9]+(?:\.[0-9]+)?",data.get("height","")):
                height = min(65,max(2.6,float(data["height"])))
            build.append([ident, round(height,2), data["building"], rings(poly)])
    water_parts = [[ident,rings(p)] for ident, geom in water_geometry.items() for p in polygon_parts(geom.intersection(area).simplify(.25)) if p.area>20]
    for node_id,n in raw_nodes.items():
        if tags(n).get("natural")=="tree":
            x,z=coords[node_id]
            if area.covers(Point(x,z)):
                trail.append([x,z])
    add_building_doors(build, public_tree, public_lines, road_buffers, water)
    airport = {"runway": [list(p) for p in points_of(ways[142030176])],
               "aprons": [rings(p) for ident in (219097651, 781892606) for p in polygon_parts(way_polygon(ident))],
               "source": "https://ais.decea.mil.br/?codigo=SBSR&i=aerodromos"}
    return {"version":1,"reference":"© OpenStreetMap contributors · ODbL 1.0","coverage":boxes,
            "origin":{"lat":ORIGIN[0],"lon":ORIGIN[1],"metresLat":METERS_PER_LATITUDE_DEGREE,"metresLon":METERS_PER_LONGITUDE_DEGREE},
            "bounds":{"minX":min_x,"maxX":max_x,"minZ":min_z,"maxZ":max_z},
            "nodes":road_nodes,"roads":roads,"water":water_parts,"parks":parks,"buildings":build,
            "trees":trail,"sites":points,"airport":airport}


def add_building_doors(buildings, public_tree, public_lines, road_buffers, water):
    """Pick an unobstructed physical entrance and a floor area within each footprint."""
    polygons = [Polygon(row[3][0], row[3][1:]) for row in buildings]
    footprints = STRtree(polygons)
    for index, (row, poly) in enumerate(zip(buildings, polygons)):
        near = public_lines[int(public_tree.nearest(poly))][3]
        candidates = []
        ring = row[3][0]
        for edge, b in enumerate(ring):
            a = ring[edge-1]
            length = math.dist(a,b)
            if length < 1.62:
                continue
            tx,tz = (b[0]-a[0])/length,(b[1]-a[1])/length
            for ratio in (.5,.25,.75):
                if min(ratio,1-ratio)*length < .79:
                    continue
                x,z = a[0]+tx*length*ratio,a[1]+tz*length*ratio
                nx,nz = -tz,tx
                if poly.covers(Point(x+nx*.16,z+nz*.16)):
                    nx,nz = -nx,-nz
                outside = Point(x+nx*1.22,z+nz*1.22)
                inside = Point(x-nx*1.10,z-nz*1.10)
                if not poly.covers(inside.buffer(.44)) or water.intersects(outside):
                    continue
                corridor = LineString([(x,z),outside]).buffer(.48)
                if any(i != index and polygons[i].intersects(corridor) for i in footprints.query(corridor)):
                    continue
                if len(road_buffers.query(outside.buffer(.27),predicate='intersects')):
                    continue
                candidates.append((outside.distance(near),edge,ratio,math.atan2(nx,nz),x,z))
        if candidates:
            _, edge, fraction, yaw, x, z = min(candidates)
            footprint_id = f"{row[0]}-{round(poly.centroid.x*10)}-{round(poly.centroid.y*10)}"
            row.append([edge,round(fraction,5),round(yaw,5),round(x,2),round(z,2),footprint_id])


def local_xy(x,z,yaw,dx,dz):
    c,s=math.cos(yaw),math.sin(yaw)
    return (x+c*dx+s*dz,z-s*dx+c*dz)


def lot_rect(x,z,yaw,w,d):
    return Polygon([local_xy(x,z,yaw,dx,dz) for dx,dz in [(-w/2,-d/2),(w/2,-d/2),(w/2,d/2),(-w/2,d/2)]])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("extracts",type=Path)
    parser.add_argument("--output",type=Path,default=ROOT/"assets/world/rio-preto-map.json")
    args = parser.parse_args()
    result=import_map(args.extracts)
    args.output.write_text(json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print({k:len(result[k]) for k in ("nodes","roads","water","parks","buildings","trees","sites")})
