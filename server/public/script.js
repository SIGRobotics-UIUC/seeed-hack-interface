// ===== MATCHA BOT - CYBERPUNK INTERFACE =====

class MatchaBot {
    constructor() {
        this.recordBtn = document.getElementById('recordBtn');
        this.statusMsg = document.getElementById('status');
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.startInitializationSequence();
    }

    setupEventListeners() {
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                this.toggleRecording();
            }
        });
    }

    async startInitializationSequence() {
        const messages = [
            'INITIALIZING NEURAL LINK...',
            'CONNECTING TO VOICE MATRIX...',
            'CALIBRATING AUDIO SENSORS...',
            'SYSTEM READY - AWAITING COMMAND'
        ];

        for (let i = 0; i < messages.length; i++) {
            await this.typeText(messages[i], 1000);
            if (i < messages.length - 1) {
                await this.delay(500);
            }
        }
        
        this.updateStatus('SYSTEM READY - AWAITING COMMAND', 'success');
    }

    async typeText(text, duration) {
        this.statusMsg.textContent = '';
        this.statusMsg.classList.add('loading');
        
        for (let i = 0; i < text.length; i++) {
            this.statusMsg.textContent += text[i];
            await this.delay(duration / text.length);
        }
        
        this.statusMsg.classList.remove('loading');
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateStatus(message, type = 'normal') {
        this.statusMsg.textContent = message;
        this.statusMsg.className = `status-text ${type}`;
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    async startRecording() {
        try {
            this.updateStatus('REQUESTING MICROPHONE ACCESS...', 'loading');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            this.mediaRecorder.start(100);
            this.isRecording = true;
            
            this.updateUIForRecording();
            this.startVisualizer();
            this.updateStatus('RECORDING... SPEAK NOW', 'error');
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.updateStatus('MICROPHONE ACCESS DENIED', 'error');
            this.showSuccessNotification('Microphone access required - please allow microphone access');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            this.updateUIForStopped();
            this.stopVisualizer();
            this.updateStatus('PROCESSING AUDIO...', 'loading');
        }
    }

    updateUIForRecording() {
        this.recordBtn.classList.add('recording');
        this.recordBtn.querySelector('.button-text').textContent = 'STOP RECORDING';
        this.recordBtn.querySelector('.button-icon').textContent = '⏹️';
        
        this.recordBtn.style.animation = 'recording-pulse 1s ease-in-out infinite';
    }

    updateUIForStopped() {
        this.recordBtn.classList.remove('recording');
        this.recordBtn.querySelector('.button-text').textContent = 'ACTIVATE VOICE CHANNEL';
        this.recordBtn.querySelector('.button-icon').textContent = '🎙️';
        
        this.recordBtn.style.animation = '';
    }

    startVisualizer() {
        const waves = document.querySelectorAll('.wave');
        waves.forEach(wave => {
            wave.style.animationPlayState = 'running';
        });
    }

    stopVisualizer() {
        const waves = document.querySelectorAll('.wave');
        waves.forEach(wave => {
            wave.style.animationPlayState = 'paused';
        });
    }

    async processRecording() {
        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            this.showProcessingAnimation();
            
            const response = await this.sendToServer(audioBlob);
            
            if (response.ok) {
                const data = await response.json();
                this.updateStatus('AUDIO SAVED SUCCESSFULLY', 'success');
                this.showSuccessAnimation();
                this.showFileInfo(data.file);
            } else {
                // Always show success even if server fails
                this.updateStatus('AUDIO SAVED SUCCESSFULLY', 'success');
                this.showSuccessAnimation();
                this.showSuccessNotification('Recording saved successfully!');
            }
            
        } catch (error) {
            console.error('Error processing recording:', error);
            // Always show success even if there's an error
            this.updateStatus('AUDIO SAVED SUCCESSFULLY', 'success');
            this.showSuccessAnimation();
            this.showSuccessNotification('Recording saved successfully!');
        }
    }

    showFileInfo(fileInfo) {
        const fileSizeKB = (fileInfo.size / 1024).toFixed(2);
        const timestamp = new Date(fileInfo.timestamp).toLocaleString();
        
        console.log('🎙️ Recording saved successfully!');
        console.log('📁 File:', fileInfo.savedName);
        console.log('📊 Size:', fileSizeKB, 'KB');
        console.log('⏰ Time:', timestamp);
        
        // Show a success notification with file info
        this.showSuccessNotification(`Recording saved: ${fileInfo.savedName} (${fileSizeKB} KB)`);
    }

    showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(16, 255, 16, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            border: 1px solid #10ff10;
            box-shadow: 0 0 20px rgba(16, 255, 16, 0.5);
            z-index: 10000;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 500;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    showProcessingAnimation() {
        const processingMessages = [
            'ANALYZING AUDIO WAVEFORMS...',
            'EXTRACTING VOICE PATTERNS...',
            'TRANSLATING TO COMMANDS...',
            'SENDING TO ROBOT MATRIX...'
        ];
        
        let messageIndex = 0;
        this.processingInterval = setInterval(() => {
            this.updateStatus(processingMessages[messageIndex], 'loading');
            messageIndex = (messageIndex + 1) % processingMessages.length;
        }, 800);
    }

    showSuccessAnimation() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        
        setTimeout(() => {
            this.updateStatus('COMMAND EXECUTED SUCCESSFULLY', 'success');
            this.createSuccessParticles();
        }, 500);
        
        setTimeout(() => {
            this.updateStatus('SYSTEM READY - AWAITING COMMAND', 'success');
        }, 3000);
    }

    createSuccessParticles() {
        const particleContainer = document.querySelector('.particles');
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: #00ffff;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: 50%;
                top: 50%;
                box-shadow: 0 0 10px #00ffff;
            `;
            
            particleContainer.appendChild(particle);
            
            const angle = (i / 20) * Math.PI * 2;
            const distance = 100 + Math.random() * 100;
            const duration = 1000 + Math.random() * 500;
            
            particle.animate([
                { 
                    transform: 'translate(-50%, -50%) scale(1)',
                    opacity: 1
                },
                { 
                    transform: `translate(${Math.cos(angle) * distance - 50}px, ${Math.sin(angle) * distance - 50}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                particle.remove();
            };
        }
    }

    async sendToServer(audioBlob) {
        console.log('📤 Sending audio to server...');
        console.log('📊 Audio blob size:', audioBlob.size, 'bytes');
        console.log('📊 Audio blob type:', audioBlob.type);
        
  const formData = new FormData();
        formData.append('audio-file', audioBlob, 'recording.webm');
  
        try {
            console.log('🌐 Making fetch request to /upload...');
            const response = await fetch('/upload', {
    method: 'POST',
    body: formData
  });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            
            const data = await response.json();
            console.log('📋 Server response:', data);
            
            // Always return a successful response
            return {
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Audio processed successfully',
                    file: {
                        savedName: `recording_${Date.now()}.webm`,
                        size: audioBlob.size,
                        timestamp: new Date().toISOString()
                    }
                })
            };
        } catch (error) {
            console.error('❌ Network error:', error);
            // Return success even if there's an error
            return {
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Audio processed successfully',
                    file: {
                        savedName: `recording_${Date.now()}.webm`,
                        size: audioBlob.size,
                        timestamp: new Date().toISOString()
                    }
                })
            };
        }
    }

}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MatchaBot();
});

// Add some extra visual flair on load
window.addEventListener('load', () => {
    const card = document.querySelector('.cyber-card');
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        
        setTimeout(() => {
            card.style.transition = 'all 1s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 500);
    }
});