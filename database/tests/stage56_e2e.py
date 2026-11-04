#!/usr/bin/env python3
"""Isolated MED-06 CI integration test, using only Python stdlib and Docker psql.
Run after the main CI seed/auth/organizer smoke test; never on production.
"""
import hashlib
import hmac
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError
from urllib.request import Request, urlopen

API = "http://127.0.0.1:3001/api"
VENUE = "30000000-0000-4000-8000-000000000001"
UUID = re.compile(r"^[0-9a-f-]{36}$")


def api(method, path, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = Request(
        API + path,
        data=json.dumps(body).encode() if body is not None else (
            b"{}" if method in ("POST", "PUT", "PATCH") else None
        ),
        headers=headers,
        method=method,
    )
    try:
        with urlopen(req, timeout=15) as resp:
            return resp.status, json.load(resp)
    except HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read())
        except ValueError:
            return exc.code, {}


def must(method, path, body=None, token=None, status=200):
    code, data = api(method, path, body, token)
    assert code == status, (path, code, data)
    return data


def sql(command):
    subprocess.run(
        ["docker", "compose", "exec", "-T", "db",
         "psql", "-U", "med06", "-d", "med06", "-v", "ON_ERROR_STOP=1", "-c", command],
        check=True,
        stdout=subprocess.DEVNULL,
    )


def time_at(minutes):
    return (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat()


def event_and_session(organizer, title, method, capacity=1):
    event = must("POST", "/manage/events",
                 {"title": title, "description": "Integration test"}, organizer, status=201)
    session = must("POST", f"/manage/events/{event['id']}/sessions", {
        "venueId": VENUE,
        "capacity": capacity,
        "startsAt": time_at(90),
        "endsAt": time_at(210),
        "registrationOpensAt": time_at(-120),
        "registrationClosesAt": time_at(30),
    }, organizer, status=201)
    must("PUT", f"/manage/sessions/{session['id']}/policy",
         {"method": method}, organizer)
    must("POST", f"/manage/events/{event['id']}/publish", {}, organizer, status=201)
    return event["id"], session["id"]


def main():
    organizer = must("POST", "/auth/login", {
        "email": "stage3-test@example.invalid", "password": "DemoSecurePass123",
    })["accessToken"]
    users = []
    for index in (1, 2):
        registration = must("POST", "/auth/register", {
            "email": f"stage56-user{index}@example.invalid",
            "name": f"Stage56 user {index}",
            "password": "TestStrongPassword123",
        }, status=201)
        assert registration["user"]["roles"] == ["ATTENDEE"]
        users.append(registration["accessToken"])

    fcfs_event, fcfs_session = event_and_session(
        organizer, "Stage56 FCFS concurrency demo", "FCFS",
    )
    with ThreadPoolExecutor(max_workers=2) as executor:
        jobs = [
            executor.submit(must, "POST", f"/registrations/sessions/{fcfs_session}",
                            {}, token, 201)
            for token in users
        ]
        results = [job.result() for job in jobs]

    assert sorted(row["status"] for row in results) == [
        "DANH_SACH_CHO", "DA_XAC_NHAN",
    ], results
    issued = next(i for i, r in enumerate(results) if r["status"] == "DA_XAC_NHAN")
    waiting = 1 - issued
    duplicate_status, _ = api(
        "POST", f"/registrations/sessions/{fcfs_session}", {}, users[issued]
    )
    assert duplicate_status == 409, duplicate_status

    must("POST", f"/registrations/{results[issued]['id']}/cancel",
         {}, users[issued], status=201)
    current = must("GET", "/registrations/mine", token=users[waiting])["items"]
    promoted = next(r for r in current if r["id"] == results[waiting]["id"])
    assert promoted["status"] == "DA_XAC_NHAN", promoted
    ticket = must("GET", "/tickets/mine", token=users[waiting])["items"]
    current_ticket = next(t for t in ticket if t["sessionId"] == fcfs_session)
    assert current_ticket["status"] == "CHUA_SU_DUNG"

    # Move the selected *CI-only* session into the 30-minute pre-start check-in window.
    assert UUID.fullmatch(fcfs_session)
    sql("UPDATE suat_su_kien SET bat_dau=now()+interval '10 minutes', "
        "ket_thuc=now()+interval '100 minutes', "
        "dong_dang_ky=now()+interval '5 minutes' "
        f"WHERE ma_suat='{fcfs_session}';")

    # Only the trained staff role can scan; a regular attendee is blocked.
    status, _ = api("POST", "/checkin/scan", {
        "sessionId": fcfs_session, "code": current_ticket["code"],
    }, users[waiting])
    assert status == 403, status

    sql(
        "INSERT INTO nguoi_dung_vai_tro(ma_nguoi_dung,ma_vai_tro) "
        "SELECT n.ma_nguoi_dung,r.ma_vai_tro FROM nguoi_dung n CROSS JOIN vai_tro r "
        "WHERE n.email='stage3-test@example.invalid' AND r.ten_vai_tro='CHECKIN' "
        "ON CONFLICT DO NOTHING;"
    )
    # Global CHECKIN role is insufficient without a per-session assignment.
    denied_status, _ = api("POST", "/checkin/scan", {
        "sessionId": fcfs_session, "code": current_ticket["code"],
    }, organizer)
    assert denied_status == 403, denied_status
    staff = must("POST", f"/manage/sessions/{fcfs_session}/staff",
                 {"email": "stage3-test@example.invalid"}, organizer, status=201)
    assert UUID.fullmatch(staff["staffId"])
    assigned = must("GET", f"/checkin/sessions", token=organizer)["items"]
    assert any(s["id"] == fcfs_session for s in assigned)

    first = must("POST", "/checkin/scan", {
        "sessionId": fcfs_session, "code": current_ticket["code"],
    }, organizer, status=201)
    assert first["accepted"] is True
    second = must("POST", "/checkin/scan", {
        "sessionId": fcfs_session, "code": current_ticket["code"],
    }, organizer, status=201)
    assert second["accepted"] is False
    stats = must("GET", f"/checkin/sessions/{fcfs_session}/stats", token=organizer)
    assert stats["used"] == 1 and stats["rejected"] >= 1, stats
    # Removing an assignment immediately revokes scan/stat privileges.
    must("DELETE", f"/manage/sessions/{fcfs_session}/staff/{staff['staffId']}",
         token=organizer)
    status_after, _ = api("GET", f"/checkin/sessions/{fcfs_session}/stats", token=organizer)
    assert status_after == 403, status_after

    print("PASS: parallel FCFS, duplicate protection, waitlist promotion and single-use check-in")

    lottery_event, lottery_session = event_and_session(
        organizer, "Stage56 LOTTERY demo", "LOTTERY",
    )
    entries = [
        must("POST", f"/registrations/sessions/{lottery_session}", {},
             token, status=201)
        for token in users
    ]
    assert all(e["status"] == "CHO_PHAN_BO" for e in entries)
    assert UUID.fullmatch(lottery_session)
    sql("UPDATE suat_su_kien SET dong_dang_ky=now()-interval '1 minute', "
        f"trang_thai='DONG_DANG_KY' WHERE ma_suat='{lottery_session}';")

    draw = must("POST", f"/manage/sessions/{lottery_session}/draw", {},
                organizer, status=201)
    assert draw["winners"] == 1 and draw["waitlisted"] == 1
    assert hashlib.sha256(bytes.fromhex(draw["auditSeed"])).hexdigest() == draw["seedSha256"]
    report = must("GET", f"/manage/sessions/{lottery_session}/draw", token=organizer)
    assert len(report["results"]) == 2
    expected = sorted(
        [e["id"] for e in entries],
        key=lambda reg: hmac.new(
            bytes.fromhex(draw["auditSeed"]), reg.encode(), hashlib.sha256
        ).hexdigest(),
    )
    winner = next(r for r in report["results"] if r["won"])["registrationId"]
    assert winner == expected[0], report
    second_draw_status, _ = api(
        "POST", f"/manage/sessions/{lottery_session}/draw", {}, organizer
    )
    assert second_draw_status == 409
    winning_index = next(i for i, entry in enumerate(entries) if entry["id"] == winner)
    must("POST", f"/registrations/{winner}/cancel", {}, users[winning_index], status=201)
    lottery_loser = users[1 - winning_index]
    tickets = must("GET", "/tickets/mine", token=lottery_loser)["items"]
    assert any(t["sessionId"] == lottery_session and
               t["status"] == "CHUA_SU_DUNG" for t in tickets), tickets
    assert must("GET", f"/events/{lottery_event}/sessions")["items"][0]["issuedSeats"] == 1
    print("PASS: lottery seeded audit, no redraw, and waitlist promotion after cancellation")
    # Admin account management: locked users lose access with previously issued JWT.
    sql("INSERT INTO nguoi_dung_vai_tro(ma_nguoi_dung,ma_vai_tro) "
        "SELECT n.ma_nguoi_dung,r.ma_vai_tro FROM nguoi_dung n CROSS JOIN vai_tro r "
        "WHERE n.email='stage3-test@example.invalid' AND r.ten_vai_tro='ADMIN' "
        "ON CONFLICT DO NOTHING;")
    mine = must("GET", "/auth/me", token=users[0])
    staff_lock = must("PATCH", f"/admin/users/{mine['id']}/status",
                      {"locked": True}, organizer)
    assert staff_lock["status"] == "KHOA"
    blocked, _ = api("GET", "/auth/me", token=users[0])
    assert blocked == 401, blocked
    blocked_login, _ = api("POST", "/auth/login", {
        "email": "stage56-user1@example.invalid", "password": "TestStrongPassword123",
    })
    assert blocked_login == 401, blocked_login
    unlocked = must("PATCH", f"/admin/users/{mine['id']}/status",
                    {"locked": False}, organizer)
    assert unlocked["status"] == "HOAT_DONG"
    must("GET", "/auth/me", token=users[0])
    self_status, _ = api("PATCH", f"/admin/users/{staff['staffId']}/status",
                         {"locked": True}, organizer)
    assert self_status == 409, self_status
    print("PASS: per-session staff assignment, revocation, account lock/unlock")

    # Daily anti-spam quota uses per-account audit history (not shared IP only).
    sql("INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet) "
        "SELECT n.ma_nguoi_dung,'DANG_KY_CHO_LOTTERY','{}'::jsonb "
        "FROM nguoi_dung n CROSS JOIN generate_series(1,20) "
        "WHERE n.email='stage56-user1@example.invalid';")
    _, quota_session = event_and_session(
        organizer, "Stage56 anti-spam quota", "FCFS",
    )
    limited, _ = api("POST", f"/registrations/sessions/{quota_session}", {}, users[0])
    assert limited == 429, limited
    other = must("POST", f"/registrations/sessions/{quota_session}",
                 {}, users[1], status=201)
    assert other["status"] == "DA_XAC_NHAN", other
    print("PASS: per-user quota without restricting unrelated user on the same IP")

    print("PASS: stage 5 and 6 integration tests")


if __name__ == "__main__":
    main()
