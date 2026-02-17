import sys
import json
import urllib.request
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QLabel, QLineEdit, QPushButton
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from . import data_info


auth_token = None

class LoginUI(QWidget):
    # Simple login dialog used as an initial gate before launching the UI.
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Fabspace AI Login")
        self.setGeometry(300, 100, 600, 400)
        # disable maximize for the login dialog
        try:
            self.setWindowFlag(Qt.WindowType.WindowMaximizeButtonHint, False)
        except Exception:
            pass
        self.setStyleSheet("background-color: #0a0a1a;")  # dark background

        # Main Layout
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        # Card Container
        card = QWidget()
        card.setStyleSheet("""
            background-color: #111122;
            border-radius: 12px;
            padding: 40px;
        """)
        card_layout = QVBoxLayout(card)
        card_layout.setSpacing(15)
        card_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        # Title
        title = QLabel("Fabspace AI")
        title.setFont(QFont("Arial", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: white;")
        card_layout.addWidget(title, alignment=Qt.AlignmentFlag.AlignCenter)

        subtitle = QLabel("Welcome back to your KiCAD plugin")
        subtitle.setFont(QFont("Arial", 10))
        subtitle.setStyleSheet("color: gray;")
        card_layout.addWidget(subtitle, alignment=Qt.AlignmentFlag.AlignCenter)

        # Username
        self.username = QLineEdit()
        self.username.setPlaceholderText("Email")
        self.username.setStyleSheet("""
            QLineEdit {
                background-color: #1a1a2e;
                color: white;
                border: 1px solid #444;
                border-radius: 8px;
                padding: 8px;
            }
            QLineEdit:focus {
                border: 1px solid #6c63ff;
            }
        """)
        card_layout.addWidget(self.username)

        # Password
        self.password = QLineEdit()
        self.password.setPlaceholderText("Password")
        self.password.setEchoMode(QLineEdit.EchoMode.Password)
        self.password.setStyleSheet("""
            QLineEdit {
                background-color: #1a1a2e;
                color: white;
                border: 1px solid #444;
                border-radius: 8px;
                padding: 8px;
            }
            QLineEdit:focus {
                border: 1px solid #6c63ff;
            }
        """)
        card_layout.addWidget(self.password)
        # Login Button (launches main UI via plugin.launch_ui)
        login_btn = QPushButton("Login")
        login_btn.setStyleSheet("""
            QPushButton {
                background-color: #6c63ff;
                color: white;
                border-radius: 8px;
                padding: 10px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #5548d9;
            }
        """)
        card_layout.addWidget(login_btn)
        # connect Login button to launch the plugin UI and close the login dialog
        login_btn.clicked.connect(self.on_login_clicked)

        # Forgot Password
        forgot = QLabel("<a href='#'>Forgot Password?</a>")
        forgot.setStyleSheet("color: #6c63ff; font-size: 10pt;")
        forgot.setAlignment(Qt.AlignmentFlag.AlignCenter)
        forgot.setOpenExternalLinks(True)
        card_layout.addWidget(forgot)

        # Add card to main layout
        layout.addWidget(card, alignment=Qt.AlignmentFlag.AlignCenter)
        self.setLayout(layout)

    def showEvent(self, event):
        # lock the dialog to its current size once shown to prevent maximizing
        try:
            self.adjustSize()
            self.setFixedSize(self.size())
        except Exception:
            pass
        super().showEvent(event)

    def on_login_clicked(self):
        """Authenticate with the local GraphQL API before launching the main UI."""
        username = self.username.text().strip()
        password = self.password.text().strip()

        if not username or not password:
            self.show_error("Please enter both username and password.")
            return

        # GraphQL API endpoint
        url = data_info.graphql_url
        query = {
            "query": """
            mutation Login($email: String!, $password: String!) {
                login(input: { email: $email, password: $password }) {
                    accessToken
                    refreshToken
                    user {
                        id
                        username
                        email
                    }
                }
            }
            """,
            "variables": {
                "email": username,
                "password": password
            }
        }

        try:
            # Send the request
            data = json.dumps(query).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req) as response:
                result = json.load(response)

            # Check for errors in the response
            if "errors" in result:
                error_message = result["errors"][0].get("message", "Unknown error occurred.")
                self.show_error(f"Login failed: {error_message}")
                return

            # Extract the token from the response
            self.auth_token = result["data"]["login"]["accessToken"]
            global auth_token
            auth_token = self.auth_token
            print(f"Retrieved token: {self.auth_token}")

            # Extract user data from the response
            user = result["data"]["login"]["user"]
            print(f"Login successful for user: {user['username']}")

            # Launch the main UI
            from .plugin import launch_ui
            launch_ui()
            self.close()

        except Exception as e:
            self.show_error(f"Failed to connect to the server: {e}")

    def show_error(self, message):
        """Display an error message to the user in white color."""
        from PyQt6.QtWidgets import QMessageBox
        msg_box = QMessageBox(self)
        msg_box.setWindowTitle("Login Error")
        msg_box.setText(message)
        msg_box.setStyleSheet("QLabel { color: white; } QPushButton { color: white; } QMessageBox { color: white; }")
        msg_box.exec()

    def changeEvent(self, event):
        try:
            if event.type() == Qt.EventType.WindowStateChange and self.isMaximized():
                self.showNormal()
        except Exception:
            pass
        super().changeEvent(event)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = LoginUI()
    window.show()
    sys.exit(app.exec())