import hashlib
import json
import os
import re
import base64
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

DANA_BASE_URL = os.environ.get("DANA_BASE_URL", "https://appserv.danaconnect.com")
DANA_TOKEN_URL = os.environ.get("DANA_TOKEN_URL", "")
DANA_CLIENT_ID = os.environ.get("DANA_CLIENT_ID", "")
DANA_CLIENT_SECRET = os.environ.get("DANA_CLIENT_SECRET", "")
DANA_OAUTH_SCOPE = os.environ.get("DANA_OAUTH_SCOPE", "")
DANA_OAUTH_AUTH_METHOD = os.environ.get("DANA_OAUTH_AUTH_METHOD", "basic")
DANA_DATA_FIELDS = os.environ.get(
    "DANA_DATA_FIELDS",
    "EMAIL,NAME,PHONE_NUMBER,WHATSAPP,CITY,ADVISOR_CODE,ROLE,PHOTO_URL,BIO,PRODUCTS",
)
DANA_FIELDS_QUERY_PARAM = os.environ.get("DANA_FIELDS_QUERY_PARAM", "fields")
MICROSITE_BASE_URL = os.environ.get("MICROSITE_BASE_URL", "https://example.com")
DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE", "")
TOKEN_CACHE = {"access_token": None, "expires_at": 0}


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


def parse_token_response(raw_body):
    data = json.loads(raw_body)
    access_token = data.get("access_token")
    if not access_token:
        raise RuntimeError(f"OAuth response sin access_token: {raw_body}")

    expires_in = int(data.get("expires_in", 300))
    TOKEN_CACHE["access_token"] = access_token
    TOKEN_CACHE["expires_at"] = int(time.time()) + max(expires_in - 30, 30)
    return access_token


def request_oauth_token():
    if not DANA_TOKEN_URL:
        raise ValueError("Falta variable de entorno DANA_TOKEN_URL")
    if not DANA_CLIENT_ID or not DANA_CLIENT_SECRET:
        raise ValueError("Faltan variables DANA_CLIENT_ID y/o DANA_CLIENT_SECRET")

    payload = {"grant_type": "client_credentials"}
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    if DANA_OAUTH_SCOPE:
        payload["scope"] = DANA_OAUTH_SCOPE

    if DANA_OAUTH_AUTH_METHOD == "body":
        payload["client_id"] = DANA_CLIENT_ID
        payload["client_secret"] = DANA_CLIENT_SECRET
    else:
        credentials = f"{DANA_CLIENT_ID}:{DANA_CLIENT_SECRET}".encode("utf-8")
        headers["Authorization"] = f"Basic {base64.b64encode(credentials).decode('utf-8')}"

    request = urllib.request.Request(
        DANA_TOKEN_URL,
        data=urllib.parse.urlencode(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=12) as result:
            raw_body = result.read().decode("utf-8")
            return parse_token_response(raw_body)
    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"DANA OAuth respondió {error.code}: {error_body}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"No se pudo conectar con DANA OAuth: {error.reason}") from error


def get_access_token():
    manual_token = os.environ.get("DANA_ACCESS_TOKEN")
    if manual_token:
        return manual_token

    if TOKEN_CACHE["access_token"] and TOKEN_CACHE["expires_at"] > int(time.time()):
        return TOKEN_CACHE["access_token"]

    return request_oauth_token()


def dana_data_url(danaparam):
    encoded_param = urllib.parse.quote(str(danaparam), safe="")
    query = urllib.parse.urlencode({DANA_FIELDS_QUERY_PARAM: DANA_DATA_FIELDS})
    return f"{DANA_BASE_URL}/api/2.0/rest/conversation/data/{encoded_param}?{query}"


def fetch_dana_contact(danaparam):
    request = urllib.request.Request(
        dana_data_url(danaparam),
        headers={
            "Authorization": f"Bearer {get_access_token()}",
            "Accept": "application/json",
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(request, timeout=12) as result:
            raw_body = result.read().decode("utf-8")
            return json.loads(raw_body)
    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"DANAconnect respondió {error.code}: {error_body}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"No se pudo conectar con DANAconnect: {error.reason}") from error


def first_value(*values, default=""):
    for value in values:
        if value not in (None, ""):
            return value
    return default


def get_nested_value(data, *keys):
    current = data
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def normalize_dana_response(data):
    if isinstance(data, list) and data:
        data = data[0]

    if not isinstance(data, dict):
        data = {}

    fields = data.get("fields") if isinstance(data.get("fields"), dict) else {}
    contact = data.get("contact") if isinstance(data.get("contact"), dict) else {}

    name = first_value(data.get("NAME"), fields.get("NAME"), contact.get("NAME"), data.get("name"))
    email = first_value(data.get("EMAIL"), fields.get("EMAIL"), contact.get("EMAIL"), data.get("email"))
    phone = first_value(
        data.get("PHONE_NUMBER"),
        fields.get("PHONE_NUMBER"),
        contact.get("PHONE_NUMBER"),
        data.get("phone"),
    )

    products = first_value(data.get("PRODUCTS"), fields.get("PRODUCTS"), contact.get("PRODUCTS"), default=[])
    if isinstance(products, str):
        products = [item.strip() for item in products.split(",") if item.strip()]
    if not isinstance(products, list):
        products = []

    advisor = {
        "name": name or "Asesor de Seguros",
        "email": email,
        "phone": phone,
        "whatsapp": first_value(data.get("WHATSAPP"), fields.get("WHATSAPP"), contact.get("WHATSAPP"), phone),
        "city": first_value(data.get("CITY"), fields.get("CITY"), contact.get("CITY"), data.get("city")),
        "advisorCode": first_value(
            data.get("ADVISOR_CODE"),
            fields.get("ADVISOR_CODE"),
            contact.get("ADVISOR_CODE"),
            data.get("advisorCode"),
        ),
        "role": first_value(
            data.get("ROLE"),
            fields.get("ROLE"),
            contact.get("ROLE"),
            data.get("role"),
            default="Asesor de Seguros",
        ),
        "photoUrl": first_value(data.get("PHOTO_URL"), fields.get("PHOTO_URL"), contact.get("PHOTO_URL"), data.get("photoUrl")),
        "bio": first_value(data.get("BIO"), fields.get("BIO"), contact.get("BIO"), data.get("bio")),
        "products": products,
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
    base_slug = slugify(advisor["name"])
    advisor_id = f"{base_slug}-{stable_suffix(danaparam)}"
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
        return {"saved": False, "reason": "DYNAMODB_TABLE no configurada"}

    table.put_item(Item=record)
    return {"saved": True, "table": DYNAMODB_TABLE}


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
        return {"saved": False, "reason": "DYNAMODB_TABLE no configurada"}

    table.put_item(Item=item)
    return {"saved": True, "table": DYNAMODB_TABLE}


def handle_landing_provision(payload):
    danaparam = payload.get("danaparam") or payload.get("advisorId")
    if not danaparam:
        return response(400, {"ok": False, "message": "Falta danaparam"})

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
        "advisor_update": ["advisorId", "name", "email", "phone", "city"],
        "pass_request": ["advisorId", "advisorEmail", "platform", "micrositeUrl"],
        "otp_request": ["advisorId", "email"],
        "otp_verify": ["advisorId", "email", "otp"],
    }

    if event_type not in required_by_type:
        return response(400, {"ok": False, "message": "Tipo de evento no soportado"})

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

    # pass_request: aqui se generaria .pkpass o pase Android y se podria devolver
    # una URL firmada. otp_request / otp_verify: aqui se integraria generacion,
    # expiracion y validacion de OTP.
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
    method = get_method(event)

    if method == "OPTIONS":
        return response(200, {"ok": True, "message": "CORS preflight ok"})

    if method == "GET":
        query = get_query_params(event)
        danaparam = query.get("danaparam")
        if danaparam:
            try:
                return handle_landing_provision({"type": "landing_provision", "danaparam": danaparam})
            except Exception as error:
                print("landing_provision_error:", str(error))
                return response(502, {"ok": False, "message": str(error), "type": "landing_provision"})

        return response(
            200,
            {
                "ok": True,
                "message": "Microsite Lambda activa",
                "usage": "POST { type: 'landing_provision', danaparam: '...' } o GET ?danaparam=...",
                "authMode": "manual_token" if os.environ.get("DANA_ACCESS_TOKEN") else "oauth_client_credentials",
            },
        )

    if method != "POST":
        return response(405, {"ok": False, "message": "Metodo no permitido"})

    payload = parse_body(event)
    if payload is None:
        return response(400, {"ok": False, "message": "Body JSON invalido"})

    event_type = payload.get("type")

    try:
        if event_type == "landing_provision":
            return handle_landing_provision(payload)
        return handle_simple_event(payload)
    except Exception as error:
        print("lambda_error:", str(error))
        return response(502, {"ok": False, "message": str(error), "type": event_type})
