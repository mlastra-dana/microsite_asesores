import base64
from decimal import Decimal
import hashlib
import hmac
import json
import os
import re
import time
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

SECURITY_HEADERS = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store",
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
DANA_CLICK_PROJECT_ID = os.environ.get("DANA_CLICK_PROJECT_ID", "")
DANA_CLICK_CONVERSATION_ID = os.environ.get("DANA_CLICK_CONVERSATION_ID", "")
DANA_CLICK_AUTH_METHOD = os.environ.get("DANA_CLICK_AUTH_METHOD", "bearer")
DANA_MICROSITE_PARAM_FIELD = os.environ.get("DANA_MICROSITE_PARAM_FIELD", "danaParam")
DANA_DATA_FIELDS = os.environ.get(
    "DANA_DATA_FIELDS",
    "ADVISORID,EMAILASESOR,FOTOASESOR,NOMBREASESOR,TELEFONOASESOR,MICROSITEID,MICROSITEURL,MICROSITEACTIVADO,danaParam,CIUDADASESOR,BIOASESOR,WEBSITEASESOR,CONTACTOASESOR,COTIZADOR_SIMPLIFICADO,COTIZADOR_SIMPLIFICADO_URL,COTIZADOR_VITALES,COTIZADOR_VITALES_URL,COTIZADOR_AUTO,COTIZADOR_AUTO_URL,COTIZADOR_SALUD,COTIZADOR_SALUD_URL,COTIZADOR_EMERGENCIAS_MEDICAS,COTIZADOR_EMERGENCIAS_MEDICAS_URL,COTIZADOR_PLATINO,COTIZADOR_PLATINO_URL,COTIZADOR_TRAVEL,COTIZADOR_TRAVEL_URL,COTIZADOR_CR,COTIZADOR_CR_URL,COTIZADOR_SALUD_PANAMA,COTIZADOR_SALUD_PANAMA_URL",
)

DANA_FIELDS_QUERY_PARAM = os.environ.get("DANA_FIELDS_QUERY_PARAM", "fieldList")

MICROSITE_BASE_URL = os.environ.get(
    "MICROSITE_BASE_URL",
    "https://main.d1w0srn8uz6n.amplifyapp.com",
)
MICROSITE_ID_SECRET = os.environ.get("MICROSITE_ID_SECRET", "")

DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE", "")
DANA_REFRESH_ON_GET = os.environ.get("DANA_REFRESH_ON_GET", "true").strip().lower() not in (
    "0",
    "false",
    "no",
)


def env_int(name, default):
    try:
        return int(os.environ.get(name, str(default)) or default)
    except (TypeError, ValueError):
        return default


DANA_REFRESH_MIN_SECONDS = env_int("DANA_REFRESH_MIN_SECONDS", 3600)

TOKEN_CACHE = {
    "access_token": None,
    "expires_at": 0,
}


def json_default(value):
    if isinstance(value, Decimal):
        if value % 1 == 0:
            return int(value)

        return float(value)

    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, **SECURITY_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False, default=json_default),
    }


def public_error(status_code, message, error_type="request_error", **extra):
    body = {
        "ok": False,
        "message": message,
        "type": error_type,
    }
    body.update(extra)
    return response(status_code, body)


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


def get_header(event, header_name):
    headers = event.get("headers") or {}
    header_name_lower = header_name.lower()

    for key, value in headers.items():
        if str(key).lower() == header_name_lower:
            return value

    return ""


def validate_required(payload, fields):
    return [field for field in fields if not payload.get(field)]


def get_oauth_token(allow_static_token=True):
    if allow_static_token and DANA_ACCESS_TOKEN:
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

    if not authorization_header:
        raise ValueError("Autenticacion DANAconnect no configurada para Data Retrieval")

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


def dana_error_message(data):
    if not isinstance(data, dict):
        return ""

    ws_error = data.get("wsError")
    if isinstance(ws_error, dict):
        return str(ws_error.get("errorDescription") or ws_error.get("message") or ws_error)

    error = data.get("error")
    if isinstance(error, dict):
        return str(error.get("errorDescription") or error.get("message") or error)

    if error:
        return str(error)

    return ""


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


def dana_start_conversation_url(conversation_id):
    encoded_conversation_id = urllib.parse.quote(str(conversation_id), safe="")
    return f"{DANA_BASE_URL.rstrip('/')}/api/2.0/rest/conversation/{encoded_conversation_id}/start/data"


def dana_start_project_conversation_url(project_id):
    encoded_project_id = urllib.parse.quote(str(project_id), safe="")
    return f"{DANA_BASE_URL.rstrip('/')}/api/2.0/rest/conversation/ProjectID/{encoded_project_id}/start/data"


def dana_click_authorization_header():
    if DANA_CLICK_AUTH_METHOD.strip().lower() == "basic":
        return dana_basic_authorization_header()

    return f"Bearer {get_oauth_token(allow_static_token=False)}"


def start_dana_click_conversation(click_payload):
    if not DANA_CLICK_PROJECT_ID and not DANA_CLICK_CONVERSATION_ID:
        return {
            "sent": False,
            "reason": "DANA_CLICK_PROJECT_ID no configurado",
        }

    try:
        authorization_header = dana_click_authorization_header()
    except Exception as error:
        print("Error preparando autenticacion click DANAconnect:", str(error))
        return {
            "sent": False,
            "reason": "Autenticacion DANA no disponible para clicks",
        }

    if not authorization_header:
        return {
            "sent": False,
            "reason": "Autenticacion DANA no configurada para clicks",
        }

    if DANA_CLICK_PROJECT_ID:
        url = dana_start_project_conversation_url(DANA_CLICK_PROJECT_ID)
    else:
        url = dana_start_conversation_url(DANA_CLICK_CONVERSATION_ID)

    data = json.dumps(click_payload, ensure_ascii=False).encode("utf-8")

    print("Enviando click a DANAconnect URL:", url)
    print("Payload click DANAconnect:", json.dumps(click_payload, ensure_ascii=False))

    request = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": authorization_header,
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=12) as result:
            raw_body = result.read().decode("utf-8")
            print("Respuesta click DANAconnect:", raw_body)
            return {
                "sent": True,
                "statusCode": result.status,
            }

    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        print("Error HTTP click DANAconnect:", error.code, error_body)
        return {
            "sent": False,
            "statusCode": error.code,
            "reason": "DANAconnect no acepto el evento de click",
        }

    except urllib.error.URLError as error:
        print("Error conexion click DANAconnect:", error.reason)
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
    ("COTIZADOR_SIMPLIFICADO", "COTIZADOR_SIMPLIFICADO_URL", "Cotizador Simplificado"),
    ("COTIZADOR_VITALES", "COTIZADOR_VITALES_URL", "Vitales"),
    ("COTIZADOR_AUTO", "COTIZADOR_AUTO_URL", "Auto"),
    ("COTIZADOR_SALUD", "COTIZADOR_SALUD_URL", "Salud"),
    ("COTIZADOR_EMERGENCIAS_MEDICAS", "COTIZADOR_EMERGENCIAS_MEDICAS_URL", "Emergencias Médicas"),
    ("COTIZADOR_PLATINO", "COTIZADOR_PLATINO_URL", "Platino"),
    ("COTIZADOR_TRAVEL", "COTIZADOR_TRAVEL_URL", "Travel"),
    ("COTIZADOR_CR", "COTIZADOR_CR_URL", "C.R."),
    ("COTIZADOR_SALUD_PANAMA", "COTIZADOR_SALUD_PANAMA_URL", "Salud Panamá"),
]


def is_enabled(value):
    return str(value or "").strip().upper() in ("SI", "SÍ", "YES", "TRUE", "1", "Y")


def is_disabled(value):
    return str(value or "").strip().upper() in ("NO", "FALSE", "0", "N")


def trimmed(value):
    return str(value or "").strip()


def field_value(payload, *names):
    advisor = payload.get("advisor") if isinstance(payload.get("advisor"), dict) else {}

    for name in names:
        value = payload.get(name)
        if value not in (None, ""):
            return value

        value = advisor.get(name)
        if value not in (None, ""):
            return value

    return ""


def is_dangerous_url(value):
    normalized = trimmed(value).lower()
    return normalized.startswith(("javascript:", "data:", "vbscript:"))


def is_https_url(value):
    normalized = trimmed(value).lower()
    return not normalized or normalized.startswith("https://")


def validate_length(errors, payload, field_name, max_length, *aliases):
    value = field_value(payload, field_name, *aliases)

    if value not in (None, "") and len(str(value)) > max_length:
        errors.append(f"{field_name} excede {max_length} caracteres")


def validate_url_field(errors, payload, field_name, require_https=False):
    value = field_value(payload, field_name)

    if not value:
        return

    if is_dangerous_url(value):
        errors.append(f"{field_name} no permite esquemas peligrosos")
        return

    if require_https and not is_https_url(value):
        errors.append(f"{field_name} debe iniciar con https://")


def validate_advisor_payload(payload):
    errors = []

    validate_length(errors, payload, "ADVISORID", 50, "AdvisorId", "internalAdvisorId")
    validate_length(errors, payload, "NOMBREASESOR", 300, "NombreAsesor", "name")
    validate_length(errors, payload, "EMAILASESOR", 254, "EmailAsesor", "email")
    validate_length(errors, payload, "TELEFONOASESOR", 30, "TelefonoAsesor", "phone")
    validate_length(errors, payload, "CIUDADASESOR", 100, "CiudadAsesor", "city")
    validate_length(errors, payload, "BIOASESOR", 1000, "BioAsesor", "bio")
    validate_length(errors, payload, "WEBSITEASESOR", 200, "WebsiteAsesor", "website")
    validate_length(errors, payload, "CONTACTOASESOR", 500, "ContactoAsesor", "contactUrl")
    validate_length(errors, payload, "FOTOASESOR", 500, "FotoAsesor", "photoUrl")

    email = trimmed(field_value(payload, "EMAILASESOR", "EmailAsesor", "email"))
    if email and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        errors.append("EMAILASESOR no tiene formato valido")

    active_value = trimmed(field_value(payload, "MICROSITEACTIVADO", "micrositeActive"))
    if active_value and not (is_enabled(active_value) or is_disabled(active_value)):
        errors.append("MICROSITEACTIVADO debe ser SI o NO")

    validate_url_field(errors, payload, "CONTACTOASESOR", require_https=True)
    validate_url_field(errors, payload, "FOTOASESOR", require_https=True)

    website = field_value(payload, "WEBSITEASESOR", "WebsiteAsesor", "website")
    if is_dangerous_url(website):
        errors.append("WEBSITEASESOR no permite esquemas peligrosos")

    for _field_code, url_field_code, _product_title in PRODUCT_FLAG_FIELDS:
        validate_url_field(errors, payload, url_field_code, require_https=True)

    return errors


def products_from_flags(data):
    enabled_products = []

    for field_code, _url_field_code, product_title in PRODUCT_FLAG_FIELDS:
        if is_enabled(extract_field(data, field_code)):
            enabled_products.append(product_title)

    return enabled_products


def product_links_from_flags(data):
    product_links = {}

    for field_code, url_field_code, product_title in PRODUCT_FLAG_FIELDS:
        if not is_enabled(extract_field(data, field_code)):
            continue

        url = str(extract_field(data, url_field_code) or "").strip()

        if url:
            product_links[product_title] = url

    return product_links


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
    advisor_code = str(advisor_id).strip()
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
    microsite_active_value = first_value(
        extract_field(data, "MICROSITEACTIVADO"),
        extract_field(data, "MicrositeActivado"),
        extract_field(data, "micrositeActive"),
    )
    products = products_from_flags(data)
    product_links = product_links_from_flags(data)

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
        "advisorId": str(microsite_id).strip(),
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
        "productLinks": product_links,
        "micrositeActive": not is_disabled(microsite_active_value),
    }

    if website:
        advisor["website"] = website

    if contact_url:
        advisor["contactUrl"] = contact_url

    return advisor


def microsite_id_secret():
    return MICROSITE_ID_SECRET or f"{MICROSITE_BASE_URL.rstrip('/')}|microsite-asesores"


def generate_microsite_id(*values):
    source = "|".join(str(value).strip() for value in values if str(value or "").strip())

    if not source:
        source = str(int(time.time() * 1000))

    digest = hmac.new(
        microsite_id_secret().encode("utf-8"),
        source.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return digest[:16].upper()


def generate_public_microsite_id(microsite_id, internal_advisor_id, dana_identifier=""):
    return generate_microsite_id(
        "public-url",
        microsite_id,
        internal_advisor_id,
        dana_identifier,
    )


def create_advisor_record(dana_identifier, dana_data, preferred_advisor_id=""):
    advisor = normalize_dana_response(dana_data)

    microsite_id_from_dana = str(advisor.get("advisorId") or "").strip()
    internal_advisor_id = str(advisor.get("internalAdvisorId") or "").strip()

    microsite_id_seed = internal_advisor_id or dana_identifier
    microsite_id = first_value(
        microsite_id_from_dana,
        generate_microsite_id("microsite-id", microsite_id_seed),
    )
    public_id_seed = internal_advisor_id or dana_identifier
    public_advisor_id = first_value(
        preferred_advisor_id,
        generate_public_microsite_id(microsite_id, public_id_seed),
    )

    advisor["advisorId"] = public_advisor_id
    advisor["micrositeId"] = microsite_id

    microsite_url = f"{MICROSITE_BASE_URL.rstrip('/')}/asesor/{public_advisor_id}"

    return {
        "advisorId": public_advisor_id,
        "micrositeId": microsite_id,
        "danaIdentifier": str(dana_identifier),
        "slug": public_advisor_id,
        "micrositeUrl": microsite_url,
        "micrositeActive": bool(advisor.get("micrositeActive", True)),
        "advisor": advisor,
        "source": "danaconnect",
        "updatedAt": int(time.time()),
        "danaRefreshedAt": int(time.time()),
    }


def create_advisor_record_from_payload(payload, preferred_advisor_id=""):
    source_data = dict(payload.get("advisor") or payload)
    internal_advisor_id = first_value(
        source_data.get("internalAdvisorId"),
        source_data.get("ADVISORID"),
        source_data.get("AdvisorId"),
        source_data.get("advisorId"),
    )
    source_identifier = first_value(
        payload.get("dana"),
        payload.get("danaParam"),
        payload.get("danaparam"),
        internal_advisor_id,
    )

    return create_advisor_record(
        source_identifier,
        source_data,
        preferred_advisor_id=preferred_advisor_id,
    )


def has_direct_advisor_payload(payload):
    if isinstance(payload.get("advisor"), dict):
        return True

    direct_fields = (
        "ADVISORID",
        "AdvisorId",
        "internalAdvisorId",
        "NOMBREASESOR",
        "NombreAsesor",
        "EMAILASESOR",
        "EmailAsesor",
        "TELEFONOASESOR",
        "TelefonoAsesor",
    )

    return any(payload.get(field) not in (None, "") for field in direct_fields)


def has_real_advisor_data(advisor):
    if not isinstance(advisor, dict):
        return False

    name = str(advisor.get("name") or "").strip()

    return any([
        str(advisor.get("internalAdvisorId") or "").strip(),
        str(advisor.get("email") or "").strip(),
        str(advisor.get("phone") or "").strip(),
        str(advisor.get("advisorCode") or "").strip(),
        name and name != "Asesor de Seguros",
    ])


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


def get_saved_record(advisor_id):
    table = dynamodb_table()

    if not table:
        print("DynamoDB no configurado. No se puede resolver advisorId:", advisor_id)
        return None

    result = table.get_item(Key={"advisorId": str(advisor_id)})
    return result.get("Item")


def public_id_for_internal_advisor(internal_advisor_id):
    internal_id = str(internal_advisor_id or "").strip()

    if not internal_id:
        return ""

    microsite_id = generate_microsite_id("microsite-id", internal_id)
    return generate_public_microsite_id(microsite_id, internal_id)


def public_id_from_microsite_url(value):
    if not value:
        return ""

    parsed = urllib.parse.urlparse(str(value))
    match = re.search(r"/asesor/([^/?#]+)", parsed.path)

    if not match:
        return ""

    return urllib.parse.unquote(match.group(1)).strip()


def resolve_public_advisor_id(payload):
    public_id = first_value(
        payload.get("publicId"),
        payload.get("publicAdvisorId"),
        payload.get("advisorPublicId"),
        public_id_from_microsite_url(payload.get("micrositeUrl") or payload.get("MICROSITEURL")),
    )

    if public_id:
        return str(public_id).strip()

    advisor_id = str(payload.get("advisorId") or payload.get("advisor_id") or "").strip()

    if advisor_id and get_saved_record(advisor_id):
        return advisor_id

    internal_advisor_id = first_value(
        payload.get("internalAdvisorId"),
        payload.get("ADVISORID"),
        payload.get("AdvisorId"),
        advisor_id,
    )

    return public_id_for_internal_advisor(internal_advisor_id)


def mark_record_active(record, active):
    next_record = dict(record)
    next_advisor = dict(next_record.get("advisor") or {})
    active_value = bool(active)
    now = int(time.time())

    next_advisor["micrositeActive"] = active_value
    next_record["advisor"] = next_advisor
    next_record["micrositeActive"] = active_value
    next_record["updatedAt"] = now

    return next_record


def advisor_sync_response(record, action, active, message, source=""):
    body = {
        "ok": True,
        "message": message,
        "type": "advisor_sync",
        "action": action,
        "advisorId": record.get("advisorId"),
        "micrositeId": record.get("micrositeId"),
        "micrositeUrl": record.get("micrositeUrl"),
        "micrositeActivado": "SI" if active else "NO",
    }

    if source:
        body["source"] = source

    return response(200, body)


PUBLIC_ADVISOR_FIELDS = (
    "name",
    "email",
    "phone",
    "whatsapp",
    "city",
    "advisorCode",
    "role",
    "photoUrl",
    "bio",
    "products",
    "productLinks",
    "website",
    "contactUrl",
    "micrositeActive",
)


def public_advisor(advisor):
    if not isinstance(advisor, dict):
        return {}

    public_data = {
        field: advisor.get(field)
        for field in PUBLIC_ADVISOR_FIELDS
        if advisor.get(field) not in (None, "")
    }

    public_data.setdefault("products", [])
    public_data.setdefault("productLinks", {})

    return public_data


def public_record_response(record, response_type, message=""):
    advisor_id = record.get("advisorId")
    body = {
        "ok": True,
        "advisorId": advisor_id,
        "type": response_type,
        "micrositeUrl": record.get("micrositeUrl"),
        "advisor": public_advisor(record.get("advisor")),
    }

    if message:
        body["message"] = message

    return body


def comparable_record(record):
    advisor = record.get("advisor") if isinstance(record, dict) else {}

    return {
        "micrositeId": record.get("micrositeId"),
        "micrositeUrl": record.get("micrositeUrl"),
        "micrositeActive": bool(record.get("micrositeActive", True)),
        "advisor": {
            "internalAdvisorId": advisor.get("internalAdvisorId"),
            "name": advisor.get("name"),
            "email": advisor.get("email"),
            "phone": advisor.get("phone"),
            "whatsapp": advisor.get("whatsapp"),
            "city": advisor.get("city"),
            "advisorCode": advisor.get("advisorCode"),
            "role": advisor.get("role"),
            "photoUrl": advisor.get("photoUrl"),
            "bio": advisor.get("bio"),
            "website": advisor.get("website"),
            "contactUrl": advisor.get("contactUrl"),
            "products": advisor.get("products") or [],
            "productLinks": advisor.get("productLinks") or {},
            "micrositeActive": bool(advisor.get("micrositeActive", True)),
        },
    }


def refresh_record_from_dana(record, fallback_advisor_id):
    if not DANA_REFRESH_ON_GET:
        return record, {
            "attempted": False,
            "refreshed": False,
            "reason": "DANA_REFRESH_ON_GET desactivado",
        }

    dana_identifier = str(record.get("danaIdentifier") or "").strip()

    if not dana_identifier:
        return record, {
            "attempted": False,
            "refreshed": False,
            "reason": "Registro sin danaIdentifier",
        }

    now = int(time.time())
    last_refresh = int(record.get("danaRefreshedAt") or record.get("updatedAt") or 0)

    if DANA_REFRESH_MIN_SECONDS > 0 and last_refresh and now - last_refresh < DANA_REFRESH_MIN_SECONDS:
        return record, {
            "attempted": True,
            "refreshed": False,
            "reason": "Snapshot vigente dentro de la ventana de refresh",
            "lastRefreshAt": last_refresh,
            "nextRefreshAt": last_refresh + DANA_REFRESH_MIN_SECONDS,
        }

    try:
        dana_data = fetch_dana_contact(dana_identifier)
        dana_error = dana_error_message(dana_data)

        if dana_error:
            return record, {
                "attempted": True,
                "refreshed": False,
                "reason": f"DANAconnect respondio: {dana_error}",
            }

        fresh_record = create_advisor_record(
            dana_identifier,
            dana_data,
            preferred_advisor_id=fallback_advisor_id,
        )
        fresh_record["danaRefreshedAt"] = now
        persistence = save_record(fresh_record)

        return fresh_record, {
            "attempted": True,
            "refreshed": True,
            "persistence": persistence,
        }

    except Exception as error:
        print("refresh_record_from_dana_error:", str(error))
        return record, {
            "attempted": True,
            "refreshed": False,
            "reason": str(error),
        }


def save_event(payload):
    table = dynamodb_table()

    event_id = f"{payload.get('type', 'event')}#{int(time.time() * 1000)}"
    target_advisor_id = str(payload.get("advisorId", "unknown"))

    item = {
        "advisorId": f"EVENT#{target_advisor_id}#{event_id}",
        "targetAdvisorId": target_advisor_id,
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


def utc_timestamp():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def handle_quote_click(payload, event):
    advisor_id = trimmed(payload.get("advisorId") or payload.get("publicId") or payload.get("PUBLICID"))
    product = trimmed(payload.get("product") or payload.get("PRODUCTO"))
    cotizador_url = trimmed(payload.get("cotizadorUrl") or payload.get("COTIZADOR_URL") or payload.get("url"))

    missing = []
    if not advisor_id:
        missing.append("advisorId")
    if not product:
        missing.append("product")
    if not cotizador_url:
        missing.append("cotizadorUrl")

    if missing:
        return response(400, {
            "ok": False,
            "message": "Campos requeridos faltantes",
            "type": "quote_click",
            "missing": missing,
        })

    if is_dangerous_url(cotizador_url) or not is_https_url(cotizador_url):
        return response(400, {
            "ok": False,
            "message": "COTIZADOR_URL debe iniciar con https://",
            "type": "quote_click",
        })

    user_agent = trimmed(payload.get("userAgent") or get_header(event, "user-agent"))
    microsite_url = trimmed(
        payload.get("micrositeUrl")
        or payload.get("MICROSITEURL")
        or f"{MICROSITE_BASE_URL.rstrip('/')}/asesor/{advisor_id}"
    )
    saved_record = None

    try:
        saved_record = get_saved_record(advisor_id)
    except Exception as error:
        print("quote_click_record_lookup_error:", str(error))

    saved_advisor = saved_record.get("advisor") if isinstance(saved_record, dict) else {}
    if not isinstance(saved_advisor, dict):
        saved_advisor = {}

    dana_click_payload = {
        "ADVISORID": trimmed(saved_advisor.get("internalAdvisorId") or payload.get("internalAdvisorId") or payload.get("advisorCode") or payload.get("ADVISORID")),
        "MICROSITEID": trimmed((saved_record or {}).get("micrositeId") or payload.get("micrositeId") or payload.get("MICROSITEID")),
        "MICROSITEURL": trimmed((saved_record or {}).get("micrositeUrl") or microsite_url),
        "NOMBREASESOR": trimmed(saved_advisor.get("name") or payload.get("advisorName") or payload.get("NOMBREASESOR")),
        "EMAILASESOR": trimmed(saved_advisor.get("email") or payload.get("advisorEmail") or payload.get("EMAILASESOR")),
        "PRODUCTO": product,
        "COTIZADOR_URL": cotizador_url,
        "USER_AGENT": user_agent[:500],
    }

    dana_result = start_dana_click_conversation(dana_click_payload)

    return response(200, {
        "ok": True,
        "message": "Click enviado a DANA",
        "type": "quote_click",
        "redirectUrl": cotizador_url,
        "danaSent": bool(dana_result.get("sent")),
    })


def handle_landing_provision(payload):
    danaparam = payload.get("danaparam") or payload.get("danaParam") or payload.get("dana") or payload.get("advisorId")

    if not danaparam:
        return response(400, {
            "ok": False,
            "message": "Falta danaparam",
        })

    dana_data = fetch_dana_contact(danaparam)

    dana_error = dana_error_message(dana_data)
    if dana_error:
        status_code = 410 if "expired" in dana_error.lower() else 502
        return response(status_code, {
            "ok": False,
            "message": f"DANAconnect respondio: {dana_error}",
            "type": "landing_provision",
        })

    record = create_advisor_record(danaparam, dana_data)
    persistence = save_record(record)

    return response(
        200,
        public_record_response(
            record,
            "landing_provision",
            "Microsite preparado correctamente",
        ),
    )


def handle_microsite_activate(payload):
    danaparam = payload.get("danaparam") or payload.get("danaParam") or payload.get("dana")

    if not danaparam:
        return response(400, {
            "ok": False,
            "message": "Falta dana",
        })

    dana_data = fetch_dana_contact(danaparam)

    dana_error = dana_error_message(dana_data)
    if dana_error:
        status_code = 410 if "expired" in dana_error.lower() else 502
        return response(status_code, {
            "ok": False,
            "message": f"DANAconnect respondio: {dana_error}",
            "type": "microsite_activate",
        })

    record = create_advisor_record(danaparam, dana_data)
    persistence = save_record(record)
    trigger_result = trigger_dana_update(danaparam, {
        "MICROSITEID": record["micrositeId"],
        "MICROSITEURL": record["micrositeUrl"],
        "MICROSITEACTIVADO": "SI",
        DANA_MICROSITE_PARAM_FIELD: danaparam,
    })

    return response(
        200,
        {
            **public_record_response(
                record,
                "microsite_activate",
                "Microsite provisionado correctamente",
            ),
            "micrositeId": record.get("micrositeId"),
        },
    )


def handle_advisor_sync(payload):
    action = str(payload.get("action") or "upsert").strip().lower()
    danaparam = payload.get("danaparam") or payload.get("danaParam") or payload.get("dana")
    inactive_actions = ("deactivate", "inactivate", "inactive", "disable", "baja", "inactivar")

    if action in inactive_actions:
        if danaparam and not has_direct_advisor_payload(payload):
            dana_data = fetch_dana_contact(danaparam)
            dana_error = dana_error_message(dana_data)

            if dana_error:
                return response(502, {
                    "ok": False,
                    "message": f"DANAconnect respondio: {dana_error}",
                    "type": "advisor_sync",
                    "action": action,
                })

            record = mark_record_active(create_advisor_record(danaparam, dana_data), False)
        else:
            public_advisor_id = resolve_public_advisor_id(payload)

            if not public_advisor_id:
                return response(400, {
                    "ok": False,
                    "message": "Falta publicId, micrositeUrl, ADVISORID o dana para inactivar el microsite",
                    "type": "advisor_sync",
                    "action": action,
                })

            saved_record = get_saved_record(public_advisor_id)

            if not saved_record:
                return response(404, {
                    "ok": False,
                    "message": "No se encontro el microsite para inactivar",
                    "type": "advisor_sync",
                    "action": action,
                    "advisorId": public_advisor_id,
                })

            record = mark_record_active(saved_record, False)

        persistence = save_record(record)
        trigger_result = None
        record_dana_identifier = first_value(danaparam, record.get("danaIdentifier"))

        if record_dana_identifier:
            trigger_result = trigger_dana_update(record_dana_identifier, {
                "MICROSITEACTIVADO": "NO",
            })

        return advisor_sync_response(
            record,
            action,
            False,
            "Microsite inactivado correctamente",
        )

    if danaparam and not has_direct_advisor_payload(payload):
        dana_data = fetch_dana_contact(danaparam)
        dana_error = dana_error_message(dana_data)

        if dana_error:
            return response(502, {
                "ok": False,
                "message": f"DANAconnect respondio: {dana_error}",
                "type": "advisor_sync",
                "action": action,
            })

        record = create_advisor_record(danaparam, dana_data)
        source = "danaconnect_lookup"
    else:
        if not first_value(
            payload.get("internalAdvisorId"),
            payload.get("ADVISORID"),
            payload.get("AdvisorId"),
            payload.get("advisorId"),
            (payload.get("advisor") or {}).get("internalAdvisorId") if isinstance(payload.get("advisor"), dict) else "",
            (payload.get("advisor") or {}).get("ADVISORID") if isinstance(payload.get("advisor"), dict) else "",
        ):
            return response(400, {
                "ok": False,
                "message": "Falta ADVISORID para crear o actualizar el microsite desde payload directo",
                "type": "advisor_sync",
                "action": action,
            })

        validation_errors = validate_advisor_payload(payload)
        if validation_errors:
            return response(400, {
                "ok": False,
                "message": "Datos de asesor invalidos",
                "type": "advisor_sync",
                "action": action,
                "errors": validation_errors,
            })

        record = create_advisor_record_from_payload(payload)
        source = "direct_payload"

    active_payload = first_value(payload.get("micrositeActive"), payload.get("MICROSITEACTIVADO"))
    active = bool(record.get("micrositeActive", True)) if active_payload == "" else not is_disabled(active_payload)
    record = mark_record_active(record, active)

    saved_record = get_saved_record(record.get("advisorId"))

    if saved_record and comparable_record(saved_record) == comparable_record(record):
        return advisor_sync_response(
            record,
            action,
            active,
            "Microsite sin cambios para actualizar",
            source=source,
        )

    persistence = save_record(record)
    trigger_result = None

    if danaparam:
        trigger_result = trigger_dana_update(danaparam, {
            "MICROSITEID": record["micrositeId"],
            "MICROSITEURL": record["micrositeUrl"],
            "MICROSITEACTIVADO": "SI" if active else "NO",
            DANA_MICROSITE_PARAM_FIELD: danaparam,
        })

    return advisor_sync_response(
        record,
        action,
        active,
        "Microsite sincronizado correctamente",
        source=source,
    )


def handle_get_advisor(query):
    advisor_id = query.get("advisorId") or query.get("advisor_id")
    should_refresh = str(query.get("refresh") or "").strip().lower() in (
        "1",
        "true",
        "yes",
        "si",
        "sí",
    )

    if not advisor_id:
        return response(400, {
            "ok": False,
            "message": "Falta advisorId",
        })

    record = get_saved_record(advisor_id)

    if not record:
        return response(404, {
            "ok": False,
            "message": "No se encontro este microsite. Debe abrirse primero desde el enlace enviado por DANA.",
            "type": "get_advisor",
            "advisorId": advisor_id,
        })

    refresh_status = {
        "attempted": False,
        "refreshed": False,
        "reason": "refresh no solicitado",
    }

    if should_refresh:
        record, refresh_status = refresh_record_from_dana(record, advisor_id)

    if not has_real_advisor_data(record.get("advisor")):
        return response(404, {
            "ok": False,
            "message": "No se encontro informacion del asesor en DANAconnect para este microsite.",
            "type": "get_advisor",
            "advisorId": advisor_id,
            "refresh": refresh_status,
        })

    if record.get("micrositeActive") is False or record.get("advisor", {}).get("micrositeActive") is False:
        return response(410, {
            "ok": False,
            "message": "Este microsite no se encuentra activo.",
            "type": "get_advisor",
            "advisorId": advisor_id,
        })

    return response(200, public_record_response(record, "get_advisor"))


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
                return public_error(
                    502,
                    "No se pudo preparar el microsite.",
                    "landing_provision",
                )

        if advisor_id:
            try:
                return handle_get_advisor(query)
            except Exception as error:
                print("get_advisor_error:", str(error))
                return public_error(
                    502,
                    "No se pudo consultar este microsite.",
                    "get_advisor",
                )

        return response(
            200,
            {
                "ok": True,
                "message": "Microsite API activa",
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

        if event_type == "advisor_sync":
            return handle_advisor_sync(payload)

        if event_type == "quote_click":
            return handle_quote_click(payload, event)

        return handle_simple_event(payload)

    except Exception as error:
        print("lambda_error:", str(error))
        return public_error(
            502,
            "No se pudo procesar la solicitud.",
            event_type or "request_error",
        )
