from google_auth_oauthlib.flow import InstalledAppFlow

CLIENT_ID = "652113866888-52lfga7r3b7cb3vhi4a6jmc9jkrm5fjh.apps.googleusercontent.com"
CLIENT_SECRET = "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"

SCOPES = [
    "https://www.googleapis.com/auth/adwords"
]

client_config = {
    "installed": {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }
}

flow = InstalledAppFlow.from_client_config(
    client_config,
    SCOPES
)

credentials = flow.run_local_server(
    port=0,
    access_type="offline",
    prompt="consent"
)

print("\n================================")
print("AUTHORIZATION SUCCESSFUL")
print("================================")
print("\nRefresh Token:")
print(credentials.refresh_token)

print("\nAccess Token:")
print(credentials.token)