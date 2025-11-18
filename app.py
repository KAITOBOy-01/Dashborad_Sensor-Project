from flask import Flask, render_template, jsonify
import serial
import time
import threading

app = Flask(__name__)

# --- ตั้งค่า Serial ---
SERIAL_PORT = 'COM7'  # <--- แก้เป็น Port ของ Arduino ตัวรับ
BAUD_RATE = 9600

# ตัวแปรเก็บค่าล่าสุด
current_data = {
    "gas": 0,
    "distance": 0,
    "light": 0
}

# เชื่อมต่อ Serial (ใส่ try-except เผื่อสายหลุด)
try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print(f"✅ Connected to {SERIAL_PORT}")
except:
    print(f"❌ Cannot connect to {SERIAL_PORT}")
    ser = None

# ฟังก์ชันอ่านค่าจาก Arduino (รันเบื้องหลังตลอดเวลา)
def read_from_arduino():
    global current_data
    while True:
        if ser and ser.in_waiting > 0:
            try:
                line = ser.readline().decode('utf-8').strip()
                # สมมติข้อมูลมาแบบ "350,120,1"
                parts = line.split(',')
                if len(parts) == 3:
                    current_data["gas"] = parts[0]
                    current_data["distance"] = parts[1]
                    current_data["light"] = parts[2]
                    print(f"Update: {current_data}")
            except:
                pass
        time.sleep(0.1)

# เริ่ม Thread อ่านข้อมูล
thread = threading.Thread(target=read_from_arduino)
thread.daemon = True
thread.start()

# --- ส่วน Web Server ---
@app.route('/')
def index():
    return render_template('index.html') # เปิดไฟล์ Dashboard ของคุณ

@app.route('/api/data')
def get_data():
    return jsonify(current_data) # ส่งค่าเป็น JSON ให้หน้าเว็บ

if __name__ == '__main__':
    app.run(debug=True, port=5000)