import json


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
}


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def parse_body(event):
    body = event.get("body")
    if body is None:
        return {}
    if isinstance(body, dict):
        return body
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return None


def validate_required(payload, fields):
    missing = [field for field in fields if not payload.get(field)]
    return missing


def lambda_handler(event, context):
    method = (
        event.get("requestContext", {})
        .get("http", {})
        .get("method", event.get("httpMethod", "GET"))
    )

    if method == "OPTIONS":
        return response(200, {"ok": True, "message": "CORS preflight ok"})

    if method == "GET":
        return response(200, {"ok": True, "message": "Microsite Lambda activa"})

    if method != "POST":
        return response(405, {"ok": False, "message": "Metodo no permitido"})

    payload = parse_body(event)
    if payload is None:
        return response(400, {"ok": False, "message": "Body JSON invalido"})

    event_type = payload.get("type")

    if event_type == "quote_request":
        required = [
            "advisorId",
            "advisorEmail",
            "customerName",
            "customerEmail",
            "customerPhone",
            "product",
        ]
    elif event_type == "advisor_update":
        required = ["advisorId", "name", "email", "phone", "city"]
    elif event_type == "pass_request":
        required = ["advisorId", "advisorEmail", "platform", "micrositeUrl"]
    elif event_type == "landing_provision":
        required = ["advisorId"]
    elif event_type == "otp_request":
        required = ["advisorId", "email"]
    elif event_type == "otp_verify":
        required = ["advisorId", "email", "otp"]
    else:
        return response(400, {"ok": False, "message": "Tipo de evento no soportado"})

    missing = validate_required(payload, required)
    if missing:
        return response(
            400,
            {
                "ok": False,
                "message": "Campos requeridos faltantes",
                "missing": missing,
                "type": event_type,
            },
        )

    print("Microsite event received:", json.dumps(payload))
    # Roadmap de implementacion:
    # - landing_provision: consultar Data Retrieval API o DANAconnect para traer
    #   el registro del asesor desde una lista de contactos.
    # - Guardar/actualizar el registro normalizado en DynamoDB con advisorId,
    #   slug limpio y micrositeUrl canonica.
    # - pass_request: generar un .pkpass para Apple Wallet o pase compatible
    #   con Android Wallet y devolver una URL firmada de descarga.
    # - otp_request / otp_verify: generar y validar OTP para que solo el asesor
    #   acceda a su espacio de actualizacion.
    # - quote_request / advisor_update: publicar en EventBridge, enviar a
    #   DANAconnect, guardar en DynamoDB o notificar al asesor por email.

    return response(
        200,
        {
            "ok": True,
            "message": "Solicitud recibida correctamente",
            "type": event_type,
        },
    )
