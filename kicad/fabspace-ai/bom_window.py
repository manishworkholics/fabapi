from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QLabel, QTableWidget, QTableWidgetItem,
    QPushButton, QHeaderView, QHBoxLayout, QMessageBox, QComboBox, QFileDialog
)
from PyQt6.QtGui import QFont
from PyQt6.QtCore import Qt, QEvent
import pcbnew
from . import data_info
import csv
import json
import urllib.request
import urllib.error

try:
    import requests
except Exception:
    requests = None


class BOMWindow(QWidget):
    # BOMWindow displays a table of components and navigation controls.
    def __init__(self, controller=None):
        # accept an optional controller (e.g., MainWindow) to support navigation
        super().__init__(controller)
        self.controller = controller
        self.init_ui()
        # try to load supplier/manufacturer list from local GraphQL API
        # this will populate self.suppliers; falls back to a built-in list on error
        self.fetch_suppliers()
        # populate the table from the active KiCad board
        self.load_bom_data()

    def fetch_suppliers(self):
        """Fetch supplier data from the local GraphQL endpoint with authentication.

        Endpoint expected from data_info.graphql_url
        GraphQL query: GetSuppliers with emsSuppliersOnly
        On failure we fallback to a short default supplier list.
        """
        # default to empty — prefer live API data. If API fails or returns no
        # suppliers we'll fall back to a minimal safe value.
        self.suppliers = []

        url = data_info.graphql_url
        query = '''{ 
            "query": "query GetSuppliers { emsSuppliersOnly { id name email phone location certifications industries emsType website } }" 
        }'''

        # Get the token from login.py
        from .login import auth_token

        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            }

            if requests:
                resp = requests.post(url, data=query, headers=headers, timeout=3)
                resp.raise_for_status()
                data = resp.json()
            else:
                req = urllib.request.Request(url, data=query.encode("utf-8"), headers=headers)
                with urllib.request.urlopen(req, timeout=3) as res:
                    data = json.load(res)

            # Validate the response structure
            if not isinstance(data, dict):
                raise ValueError(f"Invalid API response: Expected a dictionary, got {type(data).__name__}.")

            payload = data.get("data")
            if not isinstance(payload, dict):
                raise ValueError(f"Invalid API response: 'data' field is missing or not a dictionary. Full response: {data}")

            suppliers = payload.get("emsSuppliersOnly")
            if not isinstance(suppliers, list):
                raise ValueError(f"Invalid API response: 'emsSuppliersOnly' field is missing or not a list. Full response: {data}")

            self.suppliers = [
                {
                    "id": s.get("id"),
                    "name": s.get("name"),
                    "email": s.get("email"),
                    "phone": s.get("phone"),
                    "location": s.get("location"),
                    "certifications": s.get("certifications"),
                    "industries": s.get("industries"),
                    "emsType": s.get("emsType"),
                    "website": s.get("website")
                }
                for s in suppliers if isinstance(s, dict) and s.get("name")
            ]

            if not self.suppliers:
                raise ValueError("No suppliers found in API response.")

        except Exception as e:
            self.suppliers = [{"name": "Other"}]
            QMessageBox.warning(self, "Suppliers", f"Could not load suppliers from API:\n{e}\nUsing fallback.")

    def init_ui(self):
        # === Global Styles ===
        self.setStyleSheet("""
            QWidget {
                background-color: #0b0b16;
                color: #ffffff;
                font-family: 'Segoe UI', Arial;
            }
            QLabel {
                color: #ffffff;
            }
            QPushButton {
                background-color: #a020f0;
                color: white;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #b94cff;
            }
        """)

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # === Navigation Bar ===
        nav_bar = QWidget()
        nav_bar.setStyleSheet("""
            QWidget {
                background-color: #121228;
                border-bottom: 1px solid #1f1f3d;
            }
            QPushButton {
                background: transparent;
                color: #bfbfbf;
                font-size: 14px;
                border: none;
                padding: 14px 20px;
            }
            QPushButton:hover {
                color: white;
            }
            QLabel#logo {
                color: white;
                font-weight: bold;
                font-size: 18px;
            }
        """)
        nav_layout = QHBoxLayout(nav_bar)
        nav_layout.setContentsMargins(20, 5, 20, 5)
        nav_layout.setSpacing(20)

        logo_label = QLabel("💠 Fabspace AI")
        logo_label.setObjectName("logo")
        nav_layout.addWidget(logo_label)
        nav_layout.addStretch()

        # navigation buttons (Home will be wired to controller if present)
        for name in ["Home", "Projects", "Components", "Resources", "Help"]:
            nav_button = QPushButton(name)
            # connect Home button to navigate back to main dashboard when controller is provided
            if name == "Home":
                nav_button.clicked.connect(self.on_home_clicked)
            nav_layout.addWidget(nav_button)

        nav_layout.addStretch()

        profile_btn = QPushButton("●")
        profile_btn.setFixedSize(32, 32)
        profile_btn.setStyleSheet("""
            QPushButton {
                background-color: #a020f0;
                border-radius: 16px;
                color: white;
                font-weight: bold;
                font-size: 14px;
            }
        """)
        nav_layout.addWidget(profile_btn)
        main_layout.addWidget(nav_bar)

        # === Main Content Area ===
        content_layout = QVBoxLayout()
        content_layout.setContentsMargins(20, 20, 20, 20)
        content_layout.setSpacing(20)

        # --- Header Section ---
        header_layout = QHBoxLayout()
        title = QLabel("BOM Check")
        title.setFont(QFont("Arial", 18, QFont.Weight.Bold))
        header_layout.addWidget(title)
        header_layout.addStretch()

        # Export, Filter and Sort controls (kept as attributes so handlers can access them)
        self.export_btn = QPushButton("Export Data")
        self.export_btn.setObjectName("blueButton")
        self.export_btn.clicked.connect(self.export_data)

        self.filter_combo = QComboBox()
        self.filter_combo.addItems(["All", "In Stock", "Backorder", "EOL"])  # availability filters
        self.filter_combo.currentTextChanged.connect(self.apply_filter)

        self.sort_combo = QComboBox()
        self.sort_combo.addItems(["Name", "MPN", "Quantity", "Availability", "Pricing", "Supplier", "MOQ", "Risk Score"]) # sort by options
        self.sort_combo.currentTextChanged.connect(self.apply_sort)

        quote_btn = QPushButton("Submit Instant Quote")
        quote_btn.setStyleSheet("""
            QPushButton {
                background-color: #a020f0;
                color: white;
                border-radius: 8px;
                padding: 10px 22px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #b94cff;
            }
        """)
        quote_btn.clicked.connect(self.on_submit_quote_clicked)
        header_layout.addWidget(quote_btn)
        # add the header (title + submit) first
        content_layout.addLayout(header_layout)

        # --- Controls row (second line) ---
        # Export on the left; Filter and Sort grouped and aligned to the right
        controls_layout = QHBoxLayout()
        controls_layout.setContentsMargins(0, 0, 0, 0)
        controls_layout.setSpacing(12)
        controls_layout.addWidget(self.export_btn)
        controls_layout.addStretch()

        # right-aligned group for filter + sort (appears under the Submit button)
        right_controls = QHBoxLayout()
        right_controls.setSpacing(8)
        right_controls.addWidget(self.filter_combo)
        right_controls.addWidget(self.sort_combo)

        controls_layout.addLayout(right_controls)
        content_layout.addLayout(controls_layout)

        # --- Table Section ---
        self.table = QTableWidget()
        self.table.setColumnCount(8)
        self.table.setHorizontalHeaderLabels([
            "NAME", "MANUFACTURER\nPART NUMBER", "QUANTITY", "AVAILABILITY",
            "PRICING", "SUPPLIER", "MOQ", "RISK SCORE"
        ])

        header = self.table.horizontalHeader()
        header.setSectionResizeMode(QHeaderView.ResizeMode.Stretch)

        self.table.setStyleSheet("""
            QHeaderView::section {
                background-color: #1a1a2e;
                color: #bfbfbf;
                padding: 8px;
                border: none;
                font-weight: bold;
            }
            QTableWidget {
                background-color: #0b0b16;
                gridline-color: #2e2e4f;
                font-size: 14px;
                border-radius: 8px;
            }
            QTableWidget::item {
                color: white;
            }
        """)

        content_layout.addWidget(self.table)
        main_layout.addLayout(content_layout)

    def load_bom_data(self):
        """Read the components from the active KiCad board and populate the table."""
        try:
            board = pcbnew.GetBoard()
            if not board:
                raise Exception("No board loaded. Please open a PCB in KiCad.")

            footprints = list(board.GetFootprints())
            if not footprints:
                raise Exception("No footprints found on this board.")

            self.table.setRowCount(len(footprints))

            for row, fp in enumerate(footprints):
                name = fp.GetReference() or "Unknown"
                mpn = fp.GetValue() or "Unknown"
                qty = "1"  # Default quantity; can be updated later
                availability = "In Stock"
                pricing = "$0.01"
                supplier = "Other"
                moq = "1"
                risk = "Low"

                for col, text in enumerate([name, mpn, qty, availability, pricing, supplier, moq, risk]):
                    if col == 5:  # SUPPLIER column
                        combo = QComboBox()
                        for sup in self.suppliers:
                            if isinstance(sup, dict):
                                supplier_name = sup.get("name", "Unknown")
                                combo.addItem(supplier_name)

                        current_supplier = text.strip()
                        for i in range(combo.count()):
                            if current_supplier.lower() in combo.itemText(i).lower():
                                combo.setCurrentIndex(i)
                                break

                        self.table.setCellWidget(row, col, combo)
                    else:
                        item = QTableWidgetItem(text)
                        item.setFlags(Qt.ItemFlag.ItemIsEnabled | Qt.ItemFlag.ItemIsSelectable)
                        self.table.setItem(row, col, item)

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to generate BOM:\n{e}")

    def on_home_clicked(self):
        """Navigate back to the main Fabspace dashboard if a controller exists."""
        if hasattr(self, "controller") and self.controller:
            try:
                # MainWindow exposes show_main_page()
                self.controller.show_main_page()
            except Exception as e:
                QMessageBox.warning(self, "Navigation Error", f"Failed to go Home:\n{e}")
        else:
            QMessageBox.information(self, "Home", "Home clicked (no controller available).")

    def on_submit_quote_clicked(self):
        """Generate quote by zipping the KiCad project files."""
        try:
            from . import quote
            
            # Create the project zip file
            zip_path = quote.zip_current_project()
            
            if zip_path:
                # Validate the zip contents
                if quote.validate_zip_contents(zip_path):
                    QMessageBox.information(
                        self,
                        "Quote Package Created",
                        f"Project files have been packaged for quote:\n{zip_path}"
                    )
                else:
                    QMessageBox.warning(
                        self,
                        "Quote Package Warning",
                        f"Quote package created but may be missing some files:\n{zip_path}"
                    )
            else:
                QMessageBox.critical(
                    self,
                    "Quote Package Error",
                    "Failed to create quote package. Please ensure a KiCad project is open."
                )
        except Exception as e:
            QMessageBox.critical(
                self,
                "Quote Error",
                f"Failed to generate quote package:\n{e}"
            )

    # note: removed maximize-guard here to restore original BOM behavior

    def export_data(self):
        """Export the visible BOM rows to CSV directly to the project folder."""
        try:
            # Get the project path from the current board
            board = pcbnew.GetBoard()
            if not board:
                QMessageBox.critical(self, "Export Error", "No board loaded.")
                return
            
            board_file = board.GetFileName()
            if not board_file:
                QMessageBox.critical(self, "Export Error", "Board file path not available.")
                return
            
            # Get the project directory
            import os
            from datetime import datetime
            project_path = os.path.dirname(board_file)
            project_name = os.path.splitext(os.path.basename(board_file))[0]
            
            # Create filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{project_name}_BOM_{timestamp}.csv"
            path = os.path.join(project_path, filename)

            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                # write header
                headers = [self.table.horizontalHeaderItem(i).text() for i in range(self.table.columnCount())]
                writer.writerow(headers)

                # iterate visible rows only
                for r in range(self.table.rowCount()):
                    if self.table.isRowHidden(r):
                        continue
                    row_vals = []
                    for c in range(self.table.columnCount()):
                        widget = self.table.cellWidget(r, c)
                        if isinstance(widget, QComboBox):
                            row_vals.append(widget.currentText())
                        else:
                            item = self.table.item(r, c)
                            row_vals.append(item.text() if item else "")
                    writer.writerow(row_vals)
            
            QMessageBox.information(self, "Export Successful", f"BOM exported to:\n{path}")
        except Exception as e:
            QMessageBox.critical(self, "Export Error", f"Failed to export BOM:\n{e}")

    def apply_filter(self, text: str):
        """Filter table rows by availability text.

        'All' shows every row; otherwise hides rows whose Availability column
        value doesn't match the selected filter.
        """
        # availability column index = 3
        for r in range(self.table.rowCount()):
            item = self.table.item(r, 3)
            val = item.text() if item else ""
            if text == "All":
                self.table.setRowHidden(r, False)
            else:
                # simple substring match (case-insensitive)
                self.table.setRowHidden(r, text.lower() not in val.lower())

    def apply_sort(self, text: str):
        """Sort the table by the selected column.

        'None' disables sorting (resets visual order to current table order).
        """
        mapping = {
            "Name": 0,
            "MPN": 1,
            "Quantity": 2,
            "Availability": 3,
            "Pricing": 4,
            "Supplier": 5,
            "MOQ": 6,
            "Risk Score": 7,
        }
        if text == "None":
            # no-op; you could implement stable reordering if you track original order
            return
        col = mapping.get(text)
        if col is not None:
            # use ascending order; switch to Qt.DescendingOrder if needed
            self.table.sortItems(col)