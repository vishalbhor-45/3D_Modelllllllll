import bpy
import sys
import os

def convert_obj_to_glb(input_path, output_path, draco_level=6):
    # Clear current Blender scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import OBJ
    bpy.ops.import_scene.obj(filepath=input_path)

    # Export as GLB with Draco compression
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=draco_level
    )

    print(f"✅ Conversion complete: {output_path}")


if __name__ == "__main__":
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]

    if len(argv) < 2:
        print("Usage: blender --background --python convert.py -- input.obj output.glb")
        sys.exit(1)

    input_file = os.path.abspath(argv[0])
    output_file = os.path.abspath(argv[1])

    convert_obj_to_glb(input_file, output_file)
