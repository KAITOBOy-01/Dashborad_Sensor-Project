const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// --- (สำคัญ!) แก้ไข Port ให้ตรงกับ Arduino Base Station ---
const COM_PORT = 'COM3'; 
// ---------------------------------------------------

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 1. Setup Serial Port
const port = new SerialPort({
  path: COM_PORT,
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// 2. เสิร์ฟไฟล์ HTML (Frontend)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); // เราจะสร้างไฟล์นี้ในส่วนถัดไป
});

// 3. เมื่อมี Browser มาเชื่อมต่อ
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// 4. เมื่อมีข้อมูลเข้ามาจาก Serial Port
parser.on('data', (line) => {
  try {
    // line จะเป็น "mq2,ldr,dist"
    console.log(`Raw data: ${line}`);
    const [mq2, ldr, dist] = line.split(',');

    if (mq2 !== undefined && ldr !== undefined && dist !== undefined) {
      const sensorData = {
        mq2: parseInt(mq2),
        ldr: parseInt(ldr),
        dist: parseInt(dist),
      };
      
      // 5. ส่งข้อมูลไปยังหน้าเว็บที่เชื่อมต่ออยู่
      io.emit('sensorData', sensorData);
    }
  } catch (err) {
    console.error('Error parsing data:', err);
  }
});

// 6. เริ่มรัน Server
server.listen(3000, () => {
  console.log('Dashboard is running at http://localhost:3000');
  console.log(`Reading data from ${COM_PORT}...`);
});

// จัดการ Error (เช่น ถอดสาย USB)
port.on('error', (err) => {
  console.error('SerialPort Error: ', err.message);
});