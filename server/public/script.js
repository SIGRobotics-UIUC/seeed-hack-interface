// script here i guess
// user side js, add animations here.
const record_btn = document.getElementById("recordBtn");
const status_msg = document.getElementById("status");
let recording_audio = false;
let mediaRecorder;
let chunks = [];

record_btn.onclick = async () => {
    if(!recording_audio){
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' }); //blob is a large binary object
            chunks = [];
            sendToServer(blob);
        };
        mediaRecorder.start();
        isRecording = true;
        btn.textContent = 'Stop Recording';
        status_msg.textContent = 'Recording...';
    }
    else{
        mediaRecorder.stop();
        isRecording = false;
        btn.textContent = 'Start Recording';
        status_msg.textContent = 'Stopped. Sending to server...';
    }
}

async function sendToServer(blob) {
  const formData = new FormData();
  formData.append('audio-file', blob, 'recording.webm');
  
  const res = await fetch('/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  console.log('Server response:', data);
}
// website requests

//     .then(function(stream) {
//         // Handle the audio stream
//     })
//     .catch(function(err) {
//         console.error('Error accessing microphone:', err);
//     });

// front end communicates with: fetch('/api/start', { method: 'POST' });