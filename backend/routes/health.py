"""
Blueprint con el endpoint de salud.
"""

from flask import Blueprint, jsonify
from controllers.health import check_health

health_bp = Blueprint("health", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health():
    return jsonify(check_health()), 200
