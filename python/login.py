from __future__ import annotations

import json
from pathlib import Path

import requests

CACHE_FILE = Path(__file__).parent / ".strava_token"
CLIENT_SECRET = "0012dc03a59bfd0340b1c75763e6e880985816a3"


def _headers() -> dict[str, str]:
    return {
        "Host": "cdn-1.strava.com",
        "Accept": "*/*",
        "Accept-Language": "en-GB,en;q=0.9",
        "User-Agent": "Strava 422.0.1 (49113)|iPhone|iPhone10,1|iOS|16.7.15|en-FR",
        "Connection": "keep-alive",
        "x-strava-nav-version": "2",
        "time-offset-seconds": "7200",
        "Content-Type": "application/json",
    }


def request_otp(email: str) -> str:
    data = {"email": email, "client_id": "1", "logging_in": True}
    resp = requests.post(
        "https://cdn-1.strava.com/api/v3/oauth/request_otp",
        headers=_headers(),
        params=[("hl", "en")],
        json=data,
    )
    resp.raise_for_status()
    return resp.json()["otp_state"]


def login_with_otp(email: str, otp_state: str, otp: str) -> str:
    data = {
        "email": email,
        "otp_state": otp_state,
        "client_id": "1",
        "otp": otp,
        "client_secret": CLIENT_SECRET,
    }
    resp = requests.post(
        "https://cdn-1.strava.com/api/v3/oauth/login/otp",
        headers=_headers(),
        params=[("hl", "en")],
        json=data,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def load_cached_token() -> str | None:
    if CACHE_FILE.exists():
        data = json.loads(CACHE_FILE.read_text())
        return data.get("access_token")
    return None


def save_token(token: str) -> None:
    CACHE_FILE.write_text(json.dumps({"access_token": token}))


def get_bearer() -> str:
    cached = load_cached_token()
    if cached:
        print("Using cached Strava token")
        return cached
    email = input("Strava email: ")
    otp_state = request_otp(email)
    print("OTP sent to your email.")
    otp = input("Enter OTP: ")
    token = login_with_otp(email, otp_state, otp)
    save_token(token)
    return token
