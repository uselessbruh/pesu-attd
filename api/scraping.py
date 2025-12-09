import re
import json
import requests
from bs4 import BeautifulSoup
from .config import (
    LOGIN_PAGE_URL, AUTH_URL, CALENDAR_URL, TIMETABLE_URL,
    ATTENDANCE_REFERER_URL, BASE_URL, BROWSER_HEADERS
)


def perform_login(username, password):
    session_obj = requests.Session()
    try:
        r_get = session_obj.get(LOGIN_PAGE_URL, headers=BROWSER_HEADERS)
        r_get.raise_for_status()
        soup = BeautifulSoup(r_get.text, 'html.parser')
        login_csrf = soup.find('input', {'name': '_csrf'})['value']

        payload = {'j_username': username, 'j_password': password, '_csrf': login_csrf}
        r_post = session_obj.post(AUTH_URL, data=payload, headers=BROWSER_HEADERS)
        r_post.raise_for_status()

        if "Bad credentials" in r_post.text:
            return None, "Invalid credentials"
        return session_obj, None
    except Exception as e:
        return None, str(e)


def get_semesters_and_csrf(session_obj, username):
    from .config import SEMESTERS_API_URL
    
    dashboard_res = session_obj.get(LOGIN_PAGE_URL, headers=BROWSER_HEADERS)
    soup = BeautifulSoup(dashboard_res.text, 'html.parser')
    
    # Get CSRF token
    csrf_input = soup.find('input', {'name': 'csrf'})
    if not csrf_input:
        csrf_input = soup.find('input', {'name': '_csrf'}) or soup.find('meta', {'name': 'csrf-token'})
        if csrf_input:
            csrf_token = csrf_input.get('value') or csrf_input.get('content')
        else:
            raise ValueError("CSRF token not found on page")
    else:
        csrf_token = csrf_input['value']
    
    # Fetch semesters from API
    semesters_res = session_obj.get(SEMESTERS_API_URL, headers={**BROWSER_HEADERS, "x-csrf-token": csrf_token})
    
    # The API returns HTML with <option> tags, not JSON
    semesters = []
    sem_soup = BeautifulSoup(semesters_res.text, 'html.parser')
    options = sem_soup.find_all('option')
    
    for opt in options:
        opt_value = opt.get('value', '').strip()
        opt_text = opt.text.strip()
        if opt_value and opt_text:
            # Remove any quotes or backslashes from the value
            opt_value = opt_value.replace('\\', '').replace('"', '').replace("'", "")
            semesters.append({
                'id': opt_value,
                'name': opt_text
            })
    
    student_name_tag = soup.find('span', class_='app-name-font')
    student_name = student_name_tag.text.strip().title() if student_name_tag else username
    return semesters, student_name, csrf_token


def get_attendance_data(session_obj, batch_id, csrf_token):
    from .config import ATTENDANCE_API_URL, ATTENDANCE_REFERER_URL
    
    if not batch_id:
        return []
    
    # Use POST request with the controller pattern
    params = {
        'menuId': '660',
        'controllerMode': '6407',
        'actionType': '8',
        'batchClassId': batch_id
    }
    
    res = session_obj.post(
        ATTENDANCE_API_URL,
        data=params,
        headers={**BROWSER_HEADERS, "x-csrf-token": csrf_token, "Referer": ATTENDANCE_REFERER_URL}
    )
    res.raise_for_status()
    
    # Try to parse as JSON first
    try:
        attendance_data = res.json()
        courses = []
        
        if isinstance(attendance_data, list):
            for item in attendance_data:
                if isinstance(item, dict):
                    try:
                        courses.append({
                            'code': item.get('subjectCode') or item.get('courseCode', ''),
                            'name': item.get('subjectName') or item.get('courseName', ''),
                            'attended': int(item.get('presentClasses') or item.get('attended', 0)),
                            'total': int(item.get('totalClasses') or item.get('total', 0)),
                            'percentage': int(float(item.get('attendancePercentage') or item.get('percentage', 0)))
                        })
                    except (ValueError, KeyError):
                        continue
        return courses
    except:
        # If not JSON, parse HTML
        soup = BeautifulSoup(res.text, 'html.parser')
        courses = []
        
        for row in soup.find_all('tr'):
            cols = row.find_all('td')
            if len(cols) >= 4:
                try:
                    attendance_text = cols[2].text.strip()
                    if '/' in attendance_text:
                        attended, total = map(int, attendance_text.split('/'))
                        percentage_text = cols[3].text.strip().replace('%', '')
                        courses.append({
                            'code': cols[0].text.strip(),
                            'name': cols[1].text.strip(),
                            'attended': attended,
                            'total': total,
                            'percentage': int(percentage_text) if percentage_text.isdigit() else 0
                        })
                except (ValueError, IndexError):
                    continue
        
        return courses


def get_calendar_data(session_obj, csrf_token):
    headers = {**BROWSER_HEADERS, "x-csrf-token": csrf_token, "Referer": ATTENDANCE_REFERER_URL}
    res = session_obj.get(CALENDAR_URL, headers=headers)
    res.raise_for_status()
    # Try both JSON.parse and JSON.stringify patterns
    match = re.search(r'var obj = JSON\.parse\((.*?)\);', res.text, re.DOTALL)
    if not match:
        # Look for array or object data directly in the response
        match = re.search(r'(\[.*?\]|\{.*?\})', res.text, re.DOTALL)
    if not match:
        raise ValueError(f"Could not parse calendar data. Response preview: {res.text[:300]}")
    calendar_json = match.group(1)
    if not calendar_json or calendar_json.strip() == '':
        raise ValueError(f"Calendar JSON is empty. Match found but content is blank.")
    try:
        # Try to parse it directly first
        return json.loads(calendar_json)
    except json.JSONDecodeError as e:
        # If it's a quoted string from JSON.parse, try removing quotes
        if calendar_json.startswith('"') and calendar_json.endswith('"'):
            try:
                unquoted = json.loads(calendar_json)  # This unquotes the string
                return json.loads(unquoted)  # Then parse the actual JSON
            except:
                pass
        raise ValueError(f"Calendar JSON decode error: {e}. Content preview: {calendar_json[:300]}")


def get_structured_timetable(session_obj, csrf_token):
    headers = {**BROWSER_HEADERS, "x-csrf-token": csrf_token, "Referer": ATTENDANCE_REFERER_URL}
    res = session_obj.get(TIMETABLE_URL, headers=headers)
    res.raise_for_status()
    slots_match = re.search(r'var timeTableTemplateDetailsJson=(.*?);', res.text, re.DOTALL)
    schedule_match = re.search(r'var timeTableJson=(.*?);', res.text, re.DOTALL)
    if not (slots_match and schedule_match):
        raise ValueError("Could not parse timetable data.")
    slots_json = json.loads(slots_match.group(1))
    schedule_json = json.loads(schedule_match.group(1))

    slot_times = {s['orderedBy']: f"{s['startTime']} - {s['endTime']}" for s in slots_json}
    days_map = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"}

    subjects_schedule = {}
    for key, value in schedule_json.items():
        if not key.startswith('ttDivText_'):
            continue
        parts = key.split('_')
        try:
            day_index = int(parts[1])
            slot_index = int(parts[2])
        except (IndexError, ValueError):
            continue

        if day_index not in days_map:
            continue
        class_time = slot_times.get(slot_index)
        if not class_time:
            continue

        subject_info = value[0].replace('ttSubject&&', '')
        subject_code = subject_info.split('-')[0]
        subject_name = '-'.join(subject_info.split('-')[1:])
        day_name = days_map[day_index]

        subjects_schedule.setdefault(subject_code, {'name': subject_name, 'schedule': {}})
        subjects_schedule[subject_code]['schedule'].setdefault(day_name, []).append(class_time)
    return subjects_schedule
