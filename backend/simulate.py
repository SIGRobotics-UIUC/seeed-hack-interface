import subprocess
import sys

def main(filename):
    # Run the command: python3 filename
    subprocess.run(["python3", filename])

if __name__ == "__main__":
    if len(sys.argv) < 2: #this should call a function that 
        print("Usage: python this_script.py <filename>")
        sys.exit(1)
    # print(sys.argv)
    main(sys.argv[1])
