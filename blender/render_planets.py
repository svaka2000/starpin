"""
Starpin — headless Blender (Cycles) photoreal planet portraits.
Run:  blender -b -P blender/render_planets.py
Outputs transparent PNGs to public/renders/<id>.png
"""
import bpy
import bmesh
import math
import os
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(ROOT, "public", "textures")
OUT = os.path.join(ROOT, "public", "renders")
os.makedirs(OUT, exist_ok=True)

# id: (color_map, bump_map|None, atmosphere_rgb|None, ring_map|None, tilt_deg)
PLANETS = {
    "sun":     ("sun.jpg",     None,           None,                 None,            0),
    "mercury": ("mercury.jpg", None,           None,                 None,            0),
    "venus":   ("venus.jpg",   None,           (0.90, 0.78, 0.50),   None,            177),
    "earth":   ("earth_day.jpg","earth_bump.jpg",(0.40, 0.62, 1.0),  None,            23),
    "moon":    ("moon.jpg",    None,           None,                 None,            7),
    "mars":    ("mars.jpg",    None,           (0.85, 0.45, 0.28),   None,            25),
    "jupiter": ("jupiter.jpg", None,           (0.85, 0.66, 0.45),   None,            3),
    "saturn":  ("saturn.jpg",  None,           None,                 "saturn_ring.jpg",27),
    "uranus":  ("uranus.jpg",  None,           (0.62, 0.90, 0.88),   None,            98),
    "neptune": ("neptune.jpg", None,           (0.30, 0.40, 1.0),    None,            28),
    "pluto":   ("pluto.jpg",   None,           None,                 None,            120),
}


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.lights, bpy.data.cameras):
        for b in list(block):
            try:
                block.remove(b)
            except Exception:
                pass


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    # Metal GPU crashes in headless (-b) mode on macOS; CPU is reliable.
    scene.cycles.device = "CPU"
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 960
    scene.render.resolution_y = 960
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    # dark fill world
    world = bpy.data.worlds.new("W")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.01, 0.012, 0.02, 1)
    bg.inputs[1].default_value = 0.12


def add_camera_and_lights(wide=False):
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 55 if wide else 70
    cam = bpy.data.objects.new("Cam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = Vector((0, -6.0, 2.6)) if wide else Vector((0, -3.6, 0.55))
    # always point the camera at the origin
    direction = Vector((0, 0, 0)) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam

    key = bpy.data.lights.new("Key", "SUN")
    key.energy = 4.0
    key.angle = math.radians(2)
    ko = bpy.data.objects.new("Key", key)
    bpy.context.collection.objects.link(ko)
    ko.rotation_euler = (math.radians(58), math.radians(8), math.radians(-48))

    rim = bpy.data.lights.new("Rim", "SUN")
    rim.energy = 2.2
    rim.color = (0.55, 0.7, 1.0)
    ro = bpy.data.objects.new("Rim", rim)
    bpy.context.collection.objects.link(ro)
    ro.rotation_euler = (math.radians(72), 0, math.radians(150))


def planet_material(name, color_map, bump_map, is_sun):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    out = nt.nodes.get("Material Output")

    img = bpy.data.images.load(os.path.join(TEX, color_map))
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img

    if is_sun:
        emi = nt.nodes.new("ShaderNodeEmission")
        emi.inputs[1].default_value = 2.4
        nt.links.new(tex.outputs["Color"], emi.inputs[0])
        nt.links.new(emi.outputs[0], out.inputs[0])
        return mat

    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.92
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.2
    if bump_map:
        bimg = bpy.data.images.load(os.path.join(TEX, bump_map))
        bimg.colorspace_settings.name = "Non-Color"
        btex = nt.nodes.new("ShaderNodeTexImage")
        btex.image = bimg
        bump = nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.25
        nt.links.new(btex.outputs["Color"], bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def atmosphere_material(rgb):
    mat = bpy.data.materials.new("Atmo")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    mix = nt.nodes.new("ShaderNodeMixShader")
    trans = nt.nodes.new("ShaderNodeBsdfTransparent")
    emi = nt.nodes.new("ShaderNodeEmission")
    emi.inputs[0].default_value = (rgb[0], rgb[1], rgb[2], 1)
    emi.inputs[1].default_value = 1.6
    fres = nt.nodes.new("ShaderNodeFresnel")
    fres.inputs[0].default_value = 1.25
    nt.links.new(fres.outputs[0], mix.inputs[0])
    nt.links.new(trans.outputs[0], mix.inputs[1])
    nt.links.new(emi.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    mat.blend_method = "BLEND" if hasattr(mat, "blend_method") else mat.blend_method
    return mat


def build_ring(ring_map, inner, outer):
    mesh = bpy.data.meshes.new("Ring")
    obj = bpy.data.objects.new("Ring", mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    seg = 128
    uv_layer = bm.loops.layers.uv.new()
    rings = []
    for i in range(seg + 1):
        a = (i / seg) * math.tau
        vi = bm.verts.new((math.cos(a) * inner, math.sin(a) * inner, 0))
        vo = bm.verts.new((math.cos(a) * outer, math.sin(a) * outer, 0))
        rings.append((vi, vo))
    for i in range(seg):
        a0 = rings[i]
        a1 = rings[i + 1]
        f = bm.faces.new((a0[0], a0[1], a1[1], a1[0]))
        for loop in f.loops:
            r = loop.vert.co.length
            u = (r - inner) / (outer - inner)
            loop[uv_layer].uv = (u, 0.5)
    bm.to_mesh(mesh)
    bm.free()

    mat = bpy.data.materials.new("RingMat")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    out = nt.nodes.get("Material Output")
    img = bpy.data.images.load(os.path.join(TEX, ring_map))
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.9
    mix = nt.nodes.new("ShaderNodeMixShader")
    trans = nt.nodes.new("ShaderNodeBsdfTransparent")
    nt.links.new(tex.outputs["Color"], mix.inputs[0])
    nt.links.new(trans.outputs[0], mix.inputs[1])
    nt.links.new(bsdf.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    obj.data.materials.append(mat)
    return obj


def render_planet(pid, cfg):
    color_map, bump_map, atmo, ring_map, tilt = cfg
    clear()
    add_camera_and_lights(wide=bool(ring_map))

    bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=1)
    planet = bpy.context.active_object
    bpy.ops.object.shade_smooth()
    planet.rotation_euler = (math.radians(tilt), 0, math.radians(-20))
    planet.data.materials.append(planet_material(pid, color_map, bump_map, pid == "sun"))

    if atmo:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1.025)
        atm = bpy.context.active_object
        bpy.ops.object.shade_smooth()
        atm.data.materials.append(atmosphere_material(atmo))

    if ring_map:
        ring = build_ring(ring_map, 1.35, 2.3)
        ring.rotation_euler = (math.radians(tilt), 0, math.radians(-20))

    out_path = os.path.join(OUT, f"{pid}.png")
    bpy.context.scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print("RENDERED", out_path)


def main():
    setup_render()
    only = os.environ.get("STARPIN_ONLY")
    for pid, cfg in PLANETS.items():
        if only and pid != only:
            continue
        try:
            render_planet(pid, cfg)
        except Exception as e:
            print("FAILED", pid, e)
    print("ALL DONE")


main()
