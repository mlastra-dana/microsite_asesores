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
DANA_ACCESS_TOKEN = os.environ.get("DANA_ACCESS_TOKEN", "")
DANA_CLIENT_ID = os.environ.get("DANA_CLIENT_ID", "")
DANA_CLIENT_SECRET = os.environ.get("DANA_CLIENT_SECRET", "")
DANA_USERNAME = os.environ.get("DANA_USERNAME", "")
DANA_PASSWORD = os.environ.get("DANA_PASSWORD", "")
DANA_OAUTH_SCOPE = os.environ.get("DANA_OAUTH_SCOPE", "")
DANA_OAUTH_AUTH_METHOD = os.environ.get("DANA_OAUTH_AUTH_METHOD", "basic")

DANA_BASE_URL = os.environ.get("DANA_BASE_URL", "https://appserv.danaconnect.com")
DANA_TRIGGER_URL = os.environ.get("DANA_TRIGGER_URL", "https://appserv.danaconnect.com/event/Trigger")
DANA_DATA_FIELDS = os.environ.get(
    "DANA_DATA_FIELDS",
    "ADVISORID,CODIGOASESOR,EMAILASESOR,FOTOASESOR,NOMBREASESOR,TELEFONOASESOR,MICROSITEID,MICROSITEURL,MICROSITEACTIVADO,CIUDADASESOR,BIOASESOR,WEBSITEASESOR,CONTACTOASESOR,COTIZADOR_SIMPLIFICADO,COTIZADOR_VITALES,COTIZADOR_AUTO,COTIZADOR_SALUD,COTIZADOR_EMERGENCIAS_MEDICAS,COTIZADOR_PLATINO,COTIZADOR_TRAVEL,COTIZADOR_CR,COTIZADOR_SALUD_PANAMA",
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
    if DANA_ACCESS_TOKEN:
        return DANA_ACCESS_TOKEN

    now = int(time.time())

    if TOKEN_CACHE["access_token"] and TOKEN_CACHE["expires_at"] > now + 60:
        return TOKEN_CACHE["access_token"]

    if not DANA_CLIENT_ID:
        raise ValueError("Falta variable de entorno DANA_CLIENT_ID")

    if not DANA_CLIENT_SECRET:
        raise ValueError("Falta variable de entorno DANA_CLIENT_SECRET")

    form_payload = {
        "grant_type": "client_credentials"
    }

    if DANA_OAUTH_SCOPE:
        form_payload["scope"] = DANA_OAUTH_SCOPE

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }

    if DANA_OAUTH_AUTH_METHOD == "body":
        form_payload["client_id"] = DANA_CLIENT_ID
        form_payload["client_secret"] = DANA_CLIENT_SECRET
    else:
        credentials = f"{DANA_CLIENT_ID}:{DANA_CLIENT_SECRET}"
        basic_auth = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
        headers["Authorization"] = f"Basic {basic_auth}"

    form_data = urllib.parse.urlencode(form_payload).encode("utf-8")

    request = urllib.request.Request(
        DANA_TOKEN_URL,
        data=form_data,
        headers=headers,
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


def dana_basic_authorization_header():
    if not DANA_USERNAME or not DANA_PASSWORD:
        return ""

    credentials = f"{DANA_USERNAME}:{DANA_PASSWORD}"
    encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    return f"Basic {encoded_credentials}"


def use_dana_basic_auth():
    return bool(DANA_USERNAME and DANA_PASSWORD)


def dana_data_url(identifier):
    encoded_param = urllib.parse.quote(str(identifier), safe="")
    query_param_name = "fields" if use_dana_basic_auth() else DANA_FIELDS_QUERY_PARAM
    query = urllib.parse.urlencode({
        query_param_name: DANA_DATA_FIELDS
    })

    api_version = "1.0" if use_dana_basic_auth() else "2.0"

    return f"{DANA_BASE_URL.rstrip('/')}/api/{api_version}/rest/conversation/data/{encoded_param}?{query}"


def fetch_dana_contact(identifier):
    url = dana_data_url(identifier)

    print("Consultando DANAconnect URL:", url)

    authorization_header = dana_basic_authorization_header()

    if not authorization_header:
        authorization_header = f"Bearer {get_oauth_token()}"

    request = urllib.request.Request(
        url,
        headers={
            "Authorization": authorization_header,
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


def trigger_dana_update(danaparam, values):
    authorization_header = dana_basic_authorization_header()

    if not authorization_header:
        return {
            "sent": False,
            "reason": "DANA_USERNAME/DANA_PASSWORD no configurados",
        }

    query = {"dana": str(danaparam)}
    query.update({
        key: str(value)
        for key, value in values.items()
        if value not in (None, "")
    })

    url = f"{DANA_TRIGGER_URL}?{urllib.parse.urlencode(query)}"
    print("Enviando Trigger DANAconnect URL:", url)

    request = urllib.request.Request(
        url,
        headers={
            "Authorization": authorization_header,
            "Accept": "application/json",
            "Content-Length": "0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=12) as result:
            raw_body = result.read().decode("utf-8")
            print("Respuesta Trigger DANAconnect:", raw_body)
            return {
                "sent": True,
                "statusCode": result.status,
                "body": raw_body,
            }

    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        print("Error HTTP Trigger DANAconnect:", error.code, error_body)
        return {
            "sent": False,
            "statusCode": error.code,
            "body": error_body,
        }

    except urllib.error.URLError as error:
        print("Error conexion Trigger DANAconnect:", error.reason)
        return {
            "sent": False,
            "reason": str(error.reason),
        }


def first_value(*values, default=""):
    for value in values:
        if value not in (None, ""):
            return value
    return default


def get_case_insensitive(data, key):
    if not isinstance(data, dict):
        return None

    key_lower = key.lower()

    for current_key, value in data.items():
        if str(current_key).lower() == key_lower:
            return value

    return None


def extract_field(data, code):
    if not isinstance(data, dict):
        return ""

    candidates = []

    candidates.append(get_case_insensitive(data, code))

    record = data.get("record")
    if isinstance(record, dict):
        candidates.append(get_case_insensitive(record, code))

    fields = data.get("fields")
    if isinstance(fields, dict):
        candidates.append(get_case_insensitive(fields, code))

    contact = data.get("contact")
    if isinstance(contact, dict):
        candidates.append(get_case_insensitive(contact, code))

    data_fields = data.get("data")
    if isinstance(data_fields, dict):
        candidates.append(get_case_insensitive(data_fields, code))

    for value in candidates:
        if value not in (None, ""):
            return value

    return ""


def split_products(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    if not value:
        return []

    return [
        item.strip()
        for item in re.split(r"[,;|]", str(value))
        if item.strip()
    ]


PRODUCT_FLAG_FIELDS = [
    ("COTIZADOR_SIMPLIFICADO", "Cotizador Simplificado"),
    ("COTIZADOR_VITALES", "Vitales"),
    ("COTIZADOR_AUTO", "Auto"),
    ("COTIZADOR_SALUD", "Salud"),
    ("COTIZADOR_EMERGENCIAS_MEDICAS", "Emergencias Médicas"),
    ("COTIZADOR_PLATINO", "Platino"),
    ("COTIZADOR_TRAVEL", "Travel"),
    ("COTIZADOR_CR", "C.R."),
    ("COTIZADOR_SALUD_PANAMA", "Salud Panamá"),
]


def is_enabled(value):
    return str(value or "").strip().upper() in ("SI", "SÍ", "YES", "TRUE", "1", "Y")


def products_from_flags(data):
    enabled_products = []

    for field_code, product_title in PRODUCT_FLAG_FIELDS:
        if is_enabled(extract_field(data, field_code)):
            enabled_products.append(product_title)

    return enabled_products


def normalize_dana_response(data):
    if isinstance(data, list) and data:
        data = data[0]

    if not isinstance(data, dict):
        data = {}

    advisor_id = first_value(
        extract_field(data, "AdvisorId"),
        extract_field(data, "ADVISORID"),
        extract_field(data, "advisorId"),
        extract_field(data, "id"),
    )
    microsite_id = first_value(
        extract_field(data, "MICROSITEID"),
        extract_field(data, "MicrositeId"),
        extract_field(data, "micrositeId"),
    )
    name = first_value(
        extract_field(data, "NombreAsesor"),
        extract_field(data, "NOMBREASESOR"),
        extract_field(data, "NAME"),
        extract_field(data, "name"),
    )
    email = first_value(
        extract_field(data, "EmailAsesor"),
        extract_field(data, "EMAILASESOR"),
        extract_field(data, "EMAIL"),
        extract_field(data, "email"),
    )
    phone = first_value(
        extract_field(data, "TelefonoAsesor"),
        extract_field(data, "TELEFONOASESOR"),
        extract_field(data, "PHONE_NUMBER"),
        extract_field(data, "phone"),
    )
    whatsapp = phone
    city = first_value(
        extract_field(data, "CiudadAsesor"),
        extract_field(data, "CIUDADASESOR"),
        extract_field(data, "CITY"),
        extract_field(data, "city"),
    )
    advisor_code = first_value(
        extract_field(data, "CodigoAsesor"),
        extract_field(data, "CODIGOASESOR"),
        extract_field(data, "ADVISOR_CODE"),
        extract_field(data, "advisorCode"),
    )
    role = "Asesor de Seguros"
    photo_url = first_value(
        extract_field(data, "FotoAsesor"),
        extract_field(data, "FOTOASESOR"),
        extract_field(data, "PHOTO_URL"),
        extract_field(data, "photoUrl"),
    )
    bio = first_value(
        extract_field(data, "BioAsesor"),
        extract_field(data, "BIOASESOR"),
        extract_field(data, "BIO"),
        extract_field(data, "bio"),
        default="Especialista en soluciones de protección personal, familiar y patrimonial.",
    )
    website = first_value(
        extract_field(data, "WebsiteAsesor"),
        extract_field(data, "WEBSITEASESOR"),
        extract_field(data, "WEBSITE"),
        extract_field(data, "website"),
    )
    contact_url = first_value(
        extract_field(data, "ContactoAsesor"),
        extract_field(data, "CONTACTOASESOR"),
        extract_field(data, "CONTACT_URL"),
        extract_field(data, "contactUrl"),
    )
    products = products_from_flags(data)

    if not products:
        products = split_products(first_value(
        extract_field(data, "ProductosAsesor"),
        extract_field(data, "PRODUCTOSASESOR"),
        extract_field(data, "PRODUCTS"),
        extract_field(data, "products"),
        ))

    if not products:
        products = ["Salud", "Auto", "Vitales"]

    advisor = {
        "advisorId": str(microsite_id or advisor_id).strip(),
        "internalAdvisorId": str(advisor_id).strip(),
        "name": first_value(name, default="Asesor de Seguros"),
        "email": email,
        "phone": phone,
        "whatsapp": whatsapp,
        "city": city,
        "advisorCode": advisor_code,
        "role": role,
        "photoUrl": photo_url,
        "bio": bio,
        "products": products,
    }

    if website:
        advisor["website"] = website

    if contact_url:
        advisor["contactUrl"] = contact_url

    return advisor


def slugify(value):
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value).strip("-").lower()
    return slug or "asesor"


def stable_suffix(value):
    return hashlib.sha1(str(value).encode("utf-8")).hexdigest()[:6]


def create_advisor_record(dana_identifier, dana_data, preferred_advisor_id=""):
    advisor = normalize_dana_response(dana_data)

    advisor_id_from_dana = str(advisor.get("advisorId") or preferred_advisor_id or "").strip()

    if advisor_id_from_dana:
        advisor_id = advisor_id_from_dana
        advisor["advisorId"] = advisor_id
    else:
        base_slug = slugify(advisor.get("name", "asesor"))
        advisor_id = f"{base_slug}-{stable_suffix(dana_identifier)}"
        advisor["advisorId"] = advisor_id

    microsite_url = f"{MICROSITE_BASE_URL.rstrip('/')}/asesor/{advisor_id}"

    return {
        "advisorId": advisor_id,
        "danaIdentifier": str(dana_identifier),
        "slug": advisor_id,
        "micrositeUrl": microsite_url,
        "advisor": advisor,
        "source": "danaconnect",
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
    danaparam = payload.get("danaparam") or payload.get("danaParam") or payload.get("dana") or payload.get("advisorId")

    if not danaparam:
        return response(400, {
            "ok": False,
            "message": "Falta danaparam",
        })

    dana_data = fetch_dana_contact(danaparam)

    record = create_advisor_record(danaparam, dana_data)

    return response(
        200,
        {
            "ok": True,
            "message": "Microsite preparado correctamente",
            "type": "landing_provision",
            **record,
        },
    )


def handle_microsite_activate(payload):
    danaparam = payload.get("danaparam") or payload.get("danaParam") or payload.get("dana")

    if not danaparam:
        return response(400, {
            "ok": False,
            "message": "Falta dana",
        })

    dana_data = fetch_dana_contact(danaparam)
    record = create_advisor_record(danaparam, dana_data)
    trigger_result = trigger_dana_update(danaparam, {
        "MICROSITEID": record["advisorId"],
        "MICROSITEURL": record["micrositeUrl"],
        "MICROSITEACTIVADO": "SI",
    })

    return response(
        200,
        {
            "ok": True,
            "message": "Microsite provisionado correctamente",
            "type": "microsite_activate",
            **record,
            "trigger": trigger_result,
        },
    )


def handle_get_advisor(query):
    advisor_id = query.get("advisorId") or query.get("advisor_id")

    if not advisor_id:
        return response(400, {
            "ok": False,
            "message": "Falta advisorId",
        })

    dana_data = fetch_dana_contact(advisor_id)
    record = create_advisor_record(advisor_id, dana_data, preferred_advisor_id=advisor_id)

    return response(200, {
        "ok": True,
        "advisorId": advisor_id,
        "type": "get_advisor",
        **record,
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

        danaparam = query.get("danaparam") or query.get("danaParam") or query.get("dana")
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
                    "landing_provision_get": "GET ?dana=VALOR_DANA_PARAM_REAL",
                    "landing_provision_post": "POST { type: 'landing_provision', dana: 'VALOR_DANA_PARAM_REAL' }",
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

        if event_type == "microsite_activate":
            return handle_microsite_activate(payload)

        return handle_simple_event(payload)

    except Exception as error:
        print("lambda_error:", str(error))
        return response(502, {
            "ok": False,
            "message": str(error),
            "type": event_type,
        })
