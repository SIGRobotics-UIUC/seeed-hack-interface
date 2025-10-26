import sounddevice as sd #captures sound device from device
import queue
import vosk #does offline speech recognition
import json #parse's the recognition results from Vosk

q = queue.Queue() #creates a new queue

def callback(indata, frames, time, status): #runs whenever the there is a chunk of sound to capture
    #indata is the raw audio data, frames is the # of samples, time is the timestamp when it was recorded, status gives error data
    q.put(bytes(indata)) #converts raw audio data into bytes and pushes into queue for main thread to process

model = vosk.Model("/Users/aarshmittal/Downloads/vosk-model-en-us-0.22")  # Path to your model
rec = vosk.KaldiRecognizer(model, 16000) #sets up the recorder to process the bytes
#kaldi is a right weight speech to text 

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
