from flask import Blueprint, jsonify, request, current_app
from controllers.analyze import process_pdf

analyze_bp = Blueprint("analyze", __name__)


@analyze_bp.route("/api/analyze", methods=["POST"])
def analyze():
    try:
        file = request.files.get("file")
        mode = request.form.get("mode", "A")
        result = process_pdf(file, mode=mode)
        return jsonify(result), 200
    except ValueError as e:
        current_app.logger.warning(f"Error de validaci\u00f3n en /api/analyze: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error interno en /api/analyze: {str(e)}", exc_info=True)
        return jsonify({"error": f"Error interno: {str(e)}"}), 500
