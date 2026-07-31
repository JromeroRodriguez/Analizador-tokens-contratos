"""
Registro de blueprints.
Importa y expone todas las rutas de la API.
"""

from flask import Flask
from routes.health import health_bp
from routes.analyze import analyze_bp


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(health_bp)
    app.register_blueprint(analyze_bp)
