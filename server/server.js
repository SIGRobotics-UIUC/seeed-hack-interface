// using express due to easy node.js setup
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const app = express();

// Serve the frontend files
app.use(express.static(path.join(__dirname, 'public'))); // doesn't feel right



// Endpoint to trigger the simulation
app.post('/run-sim', (req, res) => {
  const scriptPath = path.join(__dirname, '../backend/simulate.py');
  const process = spawn('python3', [scriptPath]);

  process.stdout.on('data', data => {
    console.log(`Robot: ${data.toString().trim()}`);
  });

  process.stderr.on('data', data => {
    console.error(`Error: ${data.toString().trim()}`);
  });

  process.on('close', code => {
    console.log(`Simulation ended with code ${code}`);
    res.json({ status: 'Simulation complete', code });
  });
});

app.post('/upload', (req, res) => {
  
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));