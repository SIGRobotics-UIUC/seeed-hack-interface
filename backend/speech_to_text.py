import sounddevice as sd #captures sound device from device
import queue
import vosk #does offline speech recognition
import json #parse's the recognition results from Vosk

q = queue.Queue()

def callback(indata, frames, time, status):
    q.put(bytes(indata))

model = vosk.Model("/Users/aarshmittal/Downloads/vosk-model-en-us-0.22")  # Path to your model
rec = vosk.KaldiRecognizer(model, 16000)

with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype='int16',
                       channels=1, callback=callback):
    print("Speak into your microphone...")
    while True:
        data = q.get()
        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            print(result["text"])
        else:
            partial = json.loads(rec.PartialResult())
            print(partial.get("partial", ""))
