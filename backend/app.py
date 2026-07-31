"""
Entry point de la aplicación Flask.
Inicializa y ejecuta el servidor.
"""

import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask
from flask_cors import CORS
from config import Config
from routes import register_blueprints


def setup_logging(app: Flask) -> None:
    os.makedirs(Config.LOG_DIR, exist_ok=True)

    handler = RotatingFileHandler(
        Config.LOG_FILE,
        maxBytes=Config.LOG_MAX_BYTES,
        backupCount=Config.LOG_BACKUP_COUNT,
    )
    handler.setLevel(logging.INFO)
    handler.setFormatter(logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    ))

    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)

    logging.getLogger("werkzeug").addHandler(handler)

    app.logger.info("Logging initialized")


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.TEMP_FOLDER, exist_ok=True)

    setup_logging(app)

    register_blueprints(app)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
