from flask import Flask, request, session, jsonify
from flask_cors import CORS
from .scraping import (
    perform_login, get_semesters_and_csrf,
    get_attendance_data, get_calendar_data, get_structured_timetable
)
from .config import SECRET_KEY

app = Flask(__name__)
app.secret_key = SECRET_KEY

# Enable CORS for frontend
CORS(app, supports_credentials=True, origins=["*"])


@app.route("/")
def index():
    return jsonify({"message": "PESU Academy API Running"})


@app.route("/api/login", methods=["POST"])
def api_login():
    username = request.form.get("username")
    password = request.form.get("password")
    _, error = perform_login(username, password)
    if error:
        return jsonify({"success": False, "error": error})
    session["username"] = username
    session["password"] = password
    return jsonify({"success": True})


@app.route("/api/all_data")
def api_all_data():
    if "username" not in session:
        return jsonify({"success": False, "error": "Not logged in"})
    try:
        username = session["username"]
        session_obj, error = perform_login(username, session["password"])
        if error:
            raise ValueError(error)
        semesters, student_name, csrf_token = get_semesters_and_csrf(session_obj, username)
        selected_batch_id = semesters[0]["id"] if semesters else None
        attendance = get_attendance_data(session_obj, selected_batch_id, csrf_token)
        
        # Try to get calendar and timetable, but don't fail if they error
        calendar = None
        calendar_error = None
        try:
            calendar = get_calendar_data(session_obj, csrf_token)
        except Exception as cal_e:
            calendar_error = str(cal_e)
        
        timetable = None
        timetable_error = None
        try:
            timetable = get_structured_timetable(session_obj, csrf_token)
        except Exception as tt_e:
            timetable_error = str(tt_e)
        
        result = {
            "success": True,
            "student_name": student_name,
            "attendance": attendance,
            "semesters": semesters,
            "calendar": calendar,
            "timetable": timetable,
        }
        
        if calendar_error:
            result["calendar_error"] = calendar_error
        if timetable_error:
            result["timetable_error"] = timetable_error
            
        return jsonify(result)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in /api/all_data: {error_details}")
        session.clear()
        return jsonify({"success": False, "error": str(e), "traceback": error_details})


@app.route('/api/logout')
def api_logout():
    session.clear()
    return jsonify({"success": True})

# For Vercel, we don't need app.run()
