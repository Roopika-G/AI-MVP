import sys
import shutil

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    # For demo, just copy input to output (no processing)
    shutil.copyfile(input_path, output_path)