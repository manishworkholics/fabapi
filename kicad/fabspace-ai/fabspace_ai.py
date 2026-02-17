from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QLabel, QPushButton,
    QSpacerItem, QSizePolicy, QStackedWidget, QHBoxLayout, QMessageBox
)
from PyQt6.QtGui import QFont, QColor, QPalette
from PyQt6.QtCore import Qt, QEvent
import sys

# Import your custom windows
from .bom_window import BOMWindow
from .drc_window import DRCWindow


class FabspaceMain(QWidget):
    """Main dashboard view"""
    def __init__(self, parent):
        super().__init__(parent)
        self.parent = parent
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        # === Title ===
        title = QLabel("Fabspace AI Plugin")
        title.setFont(QFont("Arial", 24, QFont.Weight.Bold))
        title.setStyleSheet("color: white;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)

        subtitle = QLabel("Your KiCad Co-pilot")
        subtitle.setStyleSheet("color: #bfbfbf; font-size: 14px;")
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)

        layout.addWidget(title)
        layout.addWidget(subtitle)
        layout.addSpacerItem(QSpacerItem(20, 40, QSizePolicy.Policy.Minimum, QSizePolicy.Policy.Expanding))

        # === Buttons ===
        button_style = """
            QPushButton {
                background-color: #4c00ff;
                color: white;
                border-radius: 10px;
                padding: 12px;
                font-size: 16px;
                font-weight: bold;
                width: 220px;
            }
            QPushButton:hover { background-color: #5e3dff; }
            QPushButton:pressed { background-color: #3b00cc; }
        """

        # --- Automate DRC ---
        self.btn_drc = QPushButton("⚙️  Automate DRC")
        self.btn_drc.setStyleSheet(button_style)
        self.btn_drc.clicked.connect(lambda: self.parent.show_drc_page())

        # --- BOM Check ---
        self.btn_bom = QPushButton("🧾  BOM Check")
        self.btn_bom.setStyleSheet(button_style)
        self.btn_bom.clicked.connect(lambda: self.parent.show_bom_page())

        # --- AI Manufacturing ---
        self.btn_ai = QPushButton("🤖  AI Manufacturing Insight")
        self.btn_ai.setStyleSheet(button_style)
        self.btn_ai.clicked.connect(self.ai_manufacturing)

        layout.addWidget(self.btn_drc, alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.btn_bom, alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.btn_ai, alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addSpacerItem(QSpacerItem(20, 40, QSizePolicy.Policy.Minimum, QSizePolicy.Policy.Expanding))
        self.setLayout(layout)

    def ai_manufacturing(self):
        self.parent.show_message("AI Manufacturing", "Manufacturing insights coming soon.")


class MainWindow(QWidget):
    """Main unified window controller"""
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Fabspace AI for KiCad")
        self.resize(1000, 700)

        # Strongly prevent maximizing/resizing: set the window to a fixed size
        # equal to the explicit initial size. This prevents expansion/maximize.
        self.setFixedSize(self.width(), self.height())
        try:
            self.setWindowFlag(Qt.WindowType.WindowMaximizeButtonHint, False)
        except Exception:
            pass

        palette = self.palette()
        palette.setColor(self.backgroundRole(), QColor("#0b0b16"))
        self.setPalette(palette)

        # === Stacked Pages ===
        self.stack = QStackedWidget()

        # Main Page
        self.main_page = FabspaceMain(self)

        # BOM Page (pass controller for navigation callbacks)
        self.bom_page = BOMWindow(controller=self)

        # DRC Page (pass controller for navigation callbacks)
        self.drc_page = DRCWindow(controller=self)

        # --- Add all pages to stack ---
        self.stack.addWidget(self.main_page)  # index 0
        self.stack.addWidget(self.bom_page)   # index 1
        self.stack.addWidget(self.drc_page)   # index 2

        # --- Layout ---
        layout = QVBoxLayout()
        layout.addWidget(self.stack)
        self.setLayout(layout)
        # ensure the layout has taken effect and lock the window size
        try:
            self.adjustSize()
            self.setFixedSize(self.size())
        except Exception:
            pass

    # === Page Navigation ===
    def show_main_page(self):
        self.stack.setCurrentIndex(0)

    def show_bom_page(self):
        self.stack.setCurrentIndex(1)

    def show_drc_page(self):
        self.stack.setCurrentIndex(2)

    # === Message Box ===
    def show_message(self, title, message):
        msg = QMessageBox(self)
        msg.setWindowTitle(title)
        msg.setText(message)
        msg.exec()

    def changeEvent(self, event):
        """Guard against the window entering a maximized state.

        Use QEvent Type comparison (more portable across PyQt versions).
        """
        try:
            if event.type() == QEvent.Type.WindowStateChange and self.isMaximized():
                self.showNormal()
        except Exception:
            pass
        super().changeEvent(event)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    win = MainWindow()
    win.show()
    sys.exit(app.exec())