"""Authenticated desktop client. Sessions live only in Windows Credential Manager."""
import json
import keyring
import requests

URL = "https://dicwdviufetibnafzipa.supabase.co"
# Publishable key, not a private credential.
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"
SERVICE = "HyperKids OptoJump"

class CloudClient:
    def __init__(self):
        self.session = None

    def request(self, path, method="GET", body=None, token=None):
        headers = {"apikey": KEY, "Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        try:
            response = requests.request(method, URL + path, json=body, headers=headers, timeout=30)
        except requests.RequestException:
            raise RuntimeError("Δεν υπάρχει σύνδεση· θα ξαναδοκιμάσουμε αυτόματα.") from None
        if not response.ok:
            # Never print auth responses, tokens or personal records.
            if response.status_code in (401, 403):
                raise RuntimeError("Δεν επιτρέπεται η πρόσβαση· συνδέσου ξανά ως admin.")
            raise RuntimeError("Αποτυχία αποστολής (%s). Έλεγξε αντιστοίχιση και μετρήσεις." % response.status_code)
        return response.json()

    def login(self, email, password):
        self.session = self.request("/auth/v1/token?grant_type=password", "POST",
                                    {"email": email, "password": password})
        self.check_admin()
        keyring.set_password(SERVICE, "session", json.dumps(self.session))

    def restore(self):
        stored = keyring.get_password(SERVICE, "session")
        if not stored:
            return False
        self.session = json.loads(stored)
        self.refresh()
        self.check_admin()
        return True

    def refresh(self):
        if not self.session:
            raise RuntimeError("Συνδέσου πρώτα.")
        self.session = self.request("/auth/v1/token?grant_type=refresh_token", "POST",
                                    {"refresh_token": self.session["refresh_token"]})
        keyring.set_password(SERVICE, "session", json.dumps(self.session))

    def check_admin(self):
        allowed = self.request("/rest/v1/rpc/has_role", "POST",
                               {"_user_id": self.session["user"]["id"], "_role": "admin"}, self.session["access_token"])
        if not allowed:
            self.session = None
            raise RuntimeError("Η πρώτη έκδοση είναι διαθέσιμη μόνο για admin.")

    def lookup(self, email):
        from urllib.parse import urlencode
        self.refresh()
        query = urlencode({"select": "id,name,email,coach_id", "email": "eq." + email.strip(), "limit": "2"})
        users = self.request("/rest/v1/app_users?" + query, token=self.session["access_token"])
        if len(users) != 1:
            raise RuntimeError("Δεν βρέθηκε μοναδικός χρήστης με αυτό το email.")
        return users[0]

    def import_attempt(self, user_id, attempt):
        return self.request("/rest/v1/rpc/import_optojump_attempt", "POST",
                            {"p_user_id": user_id, "p_attempt": attempt}, self.session["access_token"])

    def logout(self):
        if self.session:
            try:
                self.request("/auth/v1/logout", "POST", token=self.session["access_token"])
            except RuntimeError:
                pass
        self.session = None
        try:
            keyring.delete_password(SERVICE, "session")
        except keyring.errors.PasswordDeleteError:
            pass
