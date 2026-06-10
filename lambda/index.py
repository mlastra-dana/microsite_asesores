import base64
import hashlib
import json
import os
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

try:
    import boto3
except ImportError:
    boto3 = None


CORS_HEADERS = {
    "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
}

DANA_TOKEN_URL = os.environ.get("DANA_TOKEN_URL", "https://auth.danaconnect.com/oauth2/token")
DANA_CLIENT_ID = os.environ.get("DANA_CLIENT_ID", "")
DANA_CLIENT_SECRET = os.environ.get("DANA_CLIENT_SECRET", "")

DANA_BASE_URL = os.environ.get("DANA_BASE_URL", "https://appserv.danaconnect.com")
DANA_DATA_FIELDS = os.environ.get(
    "DANA_DATA_FIELDS",
    "ADVISORID,CODIGOASESOR,EMAILASESOR,FOTOASESOR,NOMBREASESOR,TELEFONOASESOR",
)

DANA_FIELDS_QUERY_PARAM = os.environ.get("DANA_FIELDS_QUERY_PARAM", "fieldList")

MICROSITE_BASE_URL = os.environ.get(
    "MICROSITE_BASE_URL",
    "https://main.d1w0srn8uz6n.amplifyapp.com",
)

DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE", "")

TOKEN_CACHE = {
    "access_token": None,
    "expires_at": 0,
}


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False),
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


def get_method(event):
    return (
        event.get("requestContext", {})
        .get("http", {})
        .get("method", event.get("httpMethod", "GET"))
    )


def get_query_params(event):
    return event.get("queryStringParameters") or {}


def validate_required(payload, fields):
    return [field for field in fields if not payload.get(field)]


def get_oauth_token():
    now = int(time.time())

    if TOKEN_CACHE["access_token"] and TOKEN_CACHE["expires_at"] > now + 60:
        return TOKEN_CACHE["access_token"]

    if not DANA_CLIENT_ID:
        raise ValueError("Falta variable de entorno DANA_CLIENT_ID")

    if not DANA_CLIENT_SECRET:
        raise ValueError("Falta variable de entorno DANA_CLIENT_SECRET")

    form_data = urllib.parse.urlencode({
        "grant_type": "client_credentials"
    }).encode("utf-8")

    credentials = f"{DANA_CLIENT_ID}:{DANA_CLIENT_SECRET}"
    basic_auth = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")

    request = urllib.request.Request(
        DANA_TOKEN_URL,
        data=form_data,
        headers={
            "Authorization": f"Basic {basic_auth}",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=12) as result:
            raw_body = result.read().decode("utf-8")
            token_response = json.loads(raw_body)

    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"No se pudo generar token DANAconnect. HTTP {error.code}: {error_body}"
        ) from error

    except urllib.error.URLError as error:
        raise RuntimeError(
            f"No se pudo conectar al token endpoint de DANAconnect: {error.reason}"
        ) from error

    access_token = token_response.get("access_token")

    if not access_token:
        raise RuntimeError(f"DANAconnect no devolvio access_token: {token_response}")

    expires_in = int(token_response.get("expires_in", 3600))

    TOKEN_CACHE["access_token"] = access_token
    TOKEN_CACHE["expires_at"] = now + expires_in

    return access_token


def dana_data_url(danaparam):
    encoded_param = urllib.parse.quote(str(danaparam), safe="")
    query = urllib.parse.urlencode({
        DANA_FIELDS_QUERY_PARAM: DANA_DATA_FIELDS
    })

    return f"{DANA_BASE_URL.rstrip('/')}/api/2.0/rest/conversation/data/{encoded_param}?{query}"


def fetch_dana_contact(danaparam):
    access_token = get_oauth_token()
    url = dana_data_url(danaparam)

    print("Consultando DANAconnect URL:", url)

    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(request, timeout=12) as result:
            raw_body = result.read().decode("utf-8")
            print("Respuesta DANAconnect:", raw_body)
            return json.loads(raw_body)

    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        print("Error HTTP DANAconnect:", error.code, error_body)
        print("URL usada:", url)

        raise RuntimeError(
            f"DANAconnect respondio {error.code}: {error_body}"
        ) from error

    except urllib.error.URLError as error:
        print("Error conexion DANAconnect:", error.reason)
        print("URL usada:", url)

        raise RuntimeError(
            f"No se pudo conectar con DANAconnect: {error.reason}"
        ) from error


def first_value(*values, default=""):
    for value in values:
        if value not in (None, ""):
            return value
    return default


def extract_field(data, code):
    if not isinstance(data, dict):
        return ""

    candidates = []

    candidates.append(data.get(code))
    candidates.append(data.get(code.upper()))
    candidates.append(data.get(code.lower()))

    record = data.get("record")
    if isinstance(record, dict):
        candidates.append(record.get(code))
        candidates.append(record.get(code.upper()))
        candidates.append(record.get(code.lower()))

    fields = data.get("fields")
    if isinstance(fields, dict):
        candidates.append(fields.get(code))
        candidates.append(fields.get(code.upper()))
        candidates.append(fields.get(code.lower()))

    contact = data.get("contact")
    if isinstance(contact, dict):
        candidates.append(contact.get(code))
        candidates.append(contact.get(code.upper()))
        candidates.append(contact.get(code.lower()))

    data_fields = data.get("data")
    if isinstance(data_fields, dict):
        candidates.append(data_fields.get(code))
        candidates.append(data_fields.get(code.upper()))
        candidates.append(data_fields.get(code.lower()))

    for value in candidates:
        if value not in (None, ""):
            return value

    return ""


def normalize_dana_response(data):
    if isinstance(data, list) and data:
        data = data[0]

    if not isinstance(data, dict):
        data = {}

    advisor_id = extract_field(data, "ADVISORID")
    name = extract_field(data, "NOMBREASESOR")
    email = extract_field(data, "EMAILASESOR")
    phone = extract_field(data, "TELEFONOASESOR")
    advisor_code = extract_field(data, "CODIGOASESOR")
    photo_url = extract_field(data, "FOTOASESOR")

    advisor = {
        "advisorId": str(advisor_id).strip(),
        "name": first_value(name, default="Asesor de Seguros"),
        "email": email,
        "phone": phone,
        "whatsapp": phone,
        "city": "",
        "advisorCode": advisor_code,
        "role": "Asesor de Seguros",
        "photoUrl": photo_url,
        "bio": "Especialista en soluciones de protección personal, familiar y patrimonial.",
        "products": [
            "Seguro de Salud",
            "Seguro de Vida",
            "Seguro de Auto",
            "Seguro de Hogar",
            "Seguro Empresarial",
        ],
    }

    return advisor


def slugify(value):
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value).strip("-").lower()
    return slug or "asesor"


def stable_suffix(value):
    return hashlib.sha1(str(value).encode("utf-8")).hexdigest()[:6]


def create_advisor_record(danaparam, dana_data):
    advisor = normalize_dana_response(dana_data)

    advisor_id_from_dana = str(advisor.get("advisorId") or "").strip()

    if advisor_id_from_dana:
        advisor_id = advisor_id_from_dana
    else:
        base_slug = slugify(advisor.get("name", "asesor"))
        advisor_id = f"{base_slug}-{stable_suffix(danaparam)}"
        advisor["advisorId"] = advisor_id

    microsite_url = f"{MICROSITE_BASE_URL.rstrip('/')}/asesor/{advisor_id}"

    return {
        "advisorId": advisor_id,
        "danaparam": str(danaparam),
        "slug": advisor_id,
        "micrositeUrl": microsite_url,
        "advisor": advisor,
        "source": "danaconnect_data_retrieval",
        "updatedAt": int(time.time()),
    }


def dynamodb_table():
    if not DYNAMODB_TABLE or not boto3:
        return None

    return boto3.resource("dynamodb").Table(DYNAMODB_TABLE)


def save_record(record):
    table = dynamodb_table()

    if not table:
        print("DynamoDB no configurado. Registro normalizado:", json.dumps(record, ensure_ascii=False))
        return {
            "saved": False,
            "reason": "DYNAMODB_TABLE no configurada",
        }

    table.put_item(Item=record)

    return {
        "saved": True,
        "table": DYNAMODB_TABLE,
    }


def save_event(payload):
    table = dynamodb_table()

    event_id = f"{payload.get('type', 'event')}#{int(time.time() * 1000)}"

    item = {
        "advisorId": payload.get("advisorId", "unknown"),
        "eventId": event_id,
        "type": payload.get("type"),
        "payload": payload,
        "createdAt": int(time.time()),
    }

    if not table:
        print("Evento recibido sin DynamoDB:", json.dumps(item, ensure_ascii=False))
        return {
            "saved": False,
            "reason": "DYNAMODB_TABLE no configurada",
        }

    table.put_item(Item=item)

    return {
        "saved": True,
        "table": DYNAMODB_TABLE,
    }


def handle_landing_provision(payload):
    danaparam = payload.get("danaparam") or payload.get("danaParam") or payload.get("advisorId")

    if not danaparam:
        return response(400, {
            "ok": False,
            "message": "Falta danaparam",
        })

    dana_data = fetch_dana_contact(danaparam)

    record = create_advisor_record(danaparam, dana_data)
    persistence = save_record(record)

    return response(
        200,
        {
            "ok": True,
            "message": "Microsite provisionado correctamente",
            "type": "landing_provision",
            **record,
            "persistence": persistence,
        },
    )


def handle_get_advisor(query):
    advisor_id = query.get("advisorId") or query.get("advisor_id")

    if not advisor_id:
        return response(400, {
            "ok": False,
            "message": "Falta advisorId",
        })

    table = dynamodb_table()

    if not table:
        return response(404, {
            "ok": False,
            "message": "DynamoDB no configurado. No se puede consultar advisor guardado.",
        })

    result = table.get_item(Key={"advisorId": advisor_id})
    item = result.get("Item")

    if not item:
        return response(404, {
            "ok": False,
            "message": "Advisor no encontrado",
            "advisorId": advisor_id,
        })

    return response(200, {
        "ok": True,
        "advisorId": advisor_id,
        "record": item,
    })


def handle_simple_event(payload):
    event_type = payload.get("type")

    required_by_type = {
        "quote_request": [
            "advisorId",
            "advisorEmail",
            "customerName",
            "customerEmail",
            "customerPhone",
            "product",
        ],
        "advisor_update": [
            "advisorId",
            "name",
            "email",
            "phone",
        ],
        "pass_request": [
            "advisorId",
            "advisorEmail",
            "platform",
            "micrositeUrl",
        ],
        "otp_request": [
            "advisorId",
            "email",
        ],
        "otp_verify": [
            "advisorId",
            "email",
            "otp",
        ],
    }

    if event_type not in required_by_type:
        return response(400, {
            "ok": False,
            "message": "Tipo de evento no soportado",
        })

    missing = validate_required(payload, required_by_type[event_type])

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

    persistence = save_event(payload)

    return response(
        200,
        {
            "ok": True,
            "message": "Solicitud recibida correctamente",
            "type": event_type,
            "persistence": persistence,
        },
    )


def lambda_handler(event, context):
    print("Evento recibido:", json.dumps(event, ensure_ascii=False))

    method = get_method(event)

    if method == "OPTIONS":
        return response(200, {
            "ok": True,
            "message": "CORS preflight ok",
        })

    if method == "GET":
        query = get_query_params(event)

        danaparam = query.get("danaparam") or query.get("danaParam")
        advisor_id = query.get("advisorId") or query.get("advisor_id")

        if danaparam:
            try:
                return handle_landing_provision({
                    "type": "landing_provision",
                    "danaparam": danaparam,
                })
            except Exception as error:
                print("landing_provision_error:", str(error))
                return response(502, {
                    "ok": False,
                    "message": str(error),
                    "type": "landing_provision",
                })

        if advisor_id:
            try:
                return handle_get_advisor(query)
            except Exception as error:
                print("get_advisor_error:", str(error))
                return response(502, {
                    "ok": False,
                    "message": str(error),
                    "type": "get_advisor",
                })

        return response(
            200,
            {
                "ok": True,
                "message": "Microsite Lambda activa",
                "usage": {
                    "landing_provision_get": "GET ?danaparam=VALOR_DANA_PARAM_REAL",
                    "landing_provision_post": "POST { type: 'landing_provision', danaparam: 'VALOR_DANA_PARAM_REAL' }",
                    "get_advisor": "GET ?advisorId=24657722",
                },
            },
        )

    if method != "POST":
        return response(405, {
            "ok": False,
            "message": "Metodo no permitido",
        })

    payload = parse_body(event)

    if payload is None:
        return response(400, {
            "ok": False,
            "message": "Body JSON invalido",
        })

    event_type = payload.get("type")

    try:
        if event_type == "landing_provision":
            return handle_landing_provision(payload)

        return handle_simple_event(payload)

    except Exception as error:
        print("lambda_error:", str(error))
        return response(502, {
            "ok": False,
            "message": str(error),
            "type": event_type,
        })