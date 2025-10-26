import sounddevice as sd
import soundfile as sf

duration = 5  # seconds
RATE = 16000 # number of audio samples captured per second (hertz)
CHANNELS = 2 # the number of input channels
DEVICE = 1  # speaker index

print("Recording...")
data = sd.rec(int(duration * RATE), samplerate=RATE, channels=CHANNELS, device=DEVICE)
sd.wait()
sf.write("test.wav", data, RATE)
print("Saved as test.wav")
