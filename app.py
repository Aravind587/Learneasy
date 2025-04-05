from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import time

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change to a secure key

# Email configuration
EMAIL_ADDRESS = "aravind.kumar18118@gmail.com" 
 # Replace with your email
EMAIL_PASSWORD = "rlrg yxzu hndi afms"    # Replace with your App Password

# Simulated user database (replace with a real database in production)
users = {}

def send_otp_email(email, otp):
    try:
        msg = MIMEMultipart()
        msg['From'] = f"LearnEasy <{EMAIL_ADDRESS}>"
        msg['To'] = email
        msg['Subject'] = "Your LearnEasy OTP"
        
        body = f"Your OTP for LearnEasy login is: {otp}\nValid for 5 minutes"
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/courses')
def courses():
    return render_template('courses.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Check if it's an email submission or OTP verification
        email = request.form.get('email')
        otp = request.form.get('otp')

        if email and not otp:  # Email submission
            # Generate OTP
            generated_otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
            
            # Store OTP and email in session
            session['otp'] = generated_otp
            session['email'] = email
            session['otp_time'] = time.time()
            
            # Send OTP
            if send_otp_email(email, generated_otp):
                return jsonify({'success': True, 'message': 'OTP sent to your email!'})
            else:
                return jsonify({'success': False, 'message': 'Failed to send OTP. Please try again.'})
        
        elif otp and 'otp' in session:  # OTP verification
            current_time = time.time()
            
            # Check if OTP is expired (5 minutes)
            if current_time - session['otp_time'] > 300:
                session.pop('otp', None)
                session.pop('otp_time', None)
                return jsonify({'success': False, 'message': 'OTP has expired! Please request a new one.'})
                
            if otp == session['otp']:
                email = session['email']
                if email not in users:
                    users[email] = {'notifications': [], 'username': email.split('@')[0]}
                    
                session['isLoggedIn'] = True
                session['username'] = users[email]['username']
                session['justLoggedIn'] = True
                session.pop('otp', None)
                session.pop('otp_time', None)
                return jsonify({'success': True, 'message': 'Login successful!', 'redirect': url_for('index')})
            else:
                return jsonify({'success': False, 'message': 'Invalid OTP!'})
    
    return render_template('login.html')

@app.route('/candidate-details')
def candidate_details():
    if not session.get('isLoggedIn'):
        return redirect(url_for('login'))
    return render_template('candidate-details.html')

@app.route('/your-courses')
def your_courses():
    if not session.get('isLoggedIn'):
        return redirect(url_for('login'))
    return render_template('your-courses.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully!', 'success')
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True, port=5500)