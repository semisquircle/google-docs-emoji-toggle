import os
import shutil
from PIL import Image


INPUT_IMG = "fish.png"
OUTPUT_DIR = "favicons" 
SIZES = [128, 48, 32, 16]


def resize_favicons(input_image_path):
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")

    try:
        with Image.open(input_image_path) as img:
            filename, ext = os.path.splitext(os.path.basename(input_image_path))
            print(f"Original image '{filename}{ext}' loaded. Size: {img.size[0]}x{img.size[1]}")
            
            for size in SIZES:
                resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
                output_path = os.path.join(OUTPUT_DIR, f"favicon-{size}{ext}")
                resized_img.save(output_path)
                print(f"Saved: {output_path}")
                
    except FileNotFoundError:
        print(f"Error: The file '{input_image_path}' was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    resize_favicons(INPUT_IMG)
