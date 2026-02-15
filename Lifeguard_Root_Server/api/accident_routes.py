from flask import Blueprint, request, jsonify
from schemas.accident_schema import AccidentSchema
from core.auth import authenticate_device
from services.accident_service import process_accident

accident_bp = Blueprint("accident", __name__)

@accident_bp.route("/api/accident", methods=["POST"])
def receive_accident():
    try:
        data = AccidentSchema(**request.json)

        # Authenticate black box
        if not authenticate_device(data.car_id, data.auth_key):
            return jsonify({"error": "Unauthorized device"}), 401

        nearest = process_accident(data)

        return jsonify({
            "status": "alert_processed",
            "service_contacted": nearest["name"] if nearest else None
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400