# Uso de Data Retrieval API de DANAconnect

Este documento aclara como esta Lambda usa la API de Data Retrieval de DANAconnect y por que existen dos caminos en el codigo.

## Decision actual

Para este proyecto, el flujo productivo recomendado no depende de Data Retrieval en cada visita al microsite.

El flujo principal es:

```text
DANA lista de contactos
-> nodo API advisor_sync
-> Lambda
-> DynamoDB
-> frontend /asesor/{PUBLICID}
```

Data Retrieval queda como compatibilidad para escenarios donde recibimos un `dana`/`danaparam` real y necesitamos leer el registro completo desde DANA.

## Version usada cuando se configura usuario y password

El camino estable probado para leer datos desde DANA fue:

```text
GET /api/1.0/rest/conversation/data/{dana}?fields=...
Authorization: Basic base64(DANA_USERNAME:DANA_PASSWORD)
```

En el codigo, esto se activa automaticamente cuando existen estas variables:

```bash
DANA_USERNAME=...
DANA_PASSWORD=...
```

Cuando esas variables existen, la Lambda:

- Usa API version `1.0`.
- Usa `Authorization: Basic ...`.
- Usa el query parameter `fields`.
- Ignora `DANA_FIELDS_QUERY_PARAM` para esa llamada.

La funcion que decide esto esta en `lambda/index.py`:

```python
def use_dana_basic_auth():
    return bool(DANA_USERNAME and DANA_PASSWORD)
```

Y la URL se construye asi:

```python
query_param_name = "fields" if use_dana_basic_auth() else DANA_FIELDS_QUERY_PARAM
api_version = "1.0" if use_dana_basic_auth() else "2.0"
```

## Camino v2 con Bearer/OAuth

La Lambda tambien mantiene compatibilidad con:

```text
GET /api/2.0/rest/conversation/data/{dana}?{DANA_FIELDS_QUERY_PARAM}=...
Authorization: Bearer <access_token>
```

Este camino se usa solo si no existen `DANA_USERNAME` y `DANA_PASSWORD`.

En ese caso, el token puede venir de:

1. `DANA_ACCESS_TOKEN`, si se define manualmente.
2. `DANA_TOKEN_URL`, `DANA_CLIENT_ID` y `DANA_CLIENT_SECRET`, si se usa OAuth client credentials.

La variable `DANA_FIELDS_QUERY_PARAM` queda configurable porque durante las pruebas aparecieron diferencias entre ejemplos y documentacion sobre el nombre del parametro. En nuestro entorno actual, si usamos Basic Auth, esto deja de ser un problema porque el codigo fuerza `fields`.

## Campos consultados

Los campos que se piden a DANA se controlan con:

```bash
DANA_DATA_FIELDS=ADVISORID,EMAILASESOR,FOTOASESOR,NOMBREASESOR,TELEFONOASESOR,MICROSITEID,MICROSITEURL,MICROSITEACTIVADO,danaParam,CIUDADASESOR,BIOASESOR,WEBSITEASESOR,CONTACTOASESOR,COTIZADOR_SIMPLIFICADO,COTIZADOR_SIMPLIFICADO_URL,COTIZADOR_VITALES,COTIZADOR_VITALES_URL,COTIZADOR_AUTO,COTIZADOR_AUTO_URL,COTIZADOR_SALUD,COTIZADOR_SALUD_URL,COTIZADOR_EMERGENCIAS_MEDICAS,COTIZADOR_EMERGENCIAS_MEDICAS_URL,COTIZADOR_PLATINO,COTIZADOR_PLATINO_URL,COTIZADOR_TRAVEL,COTIZADOR_TRAVEL_URL,COTIZADOR_CR,COTIZADOR_CR_URL,COTIZADOR_SALUD_PANAMA,COTIZADOR_SALUD_PANAMA_URL
```

Si se agrega un campo nuevo a la lista de contactos y se quiere leer por Data Retrieval, tambien debe agregarse a `DANA_DATA_FIELDS`.

## Donde se usa Data Retrieval en la Lambda

Data Retrieval se usa cuando el request trae un identificador de DANA:

```text
GET ?dana=VALOR_REAL
GET ?danaparam=VALOR_REAL
POST type=landing_provision con dana/danaparam
POST type=microsite_activate con dana/danaparam
POST type=advisor_sync con dana/danaparam y sin payload directo
```

Para el flujo actual de producto, lo preferido es que el nodo API de DANA envie el payload completo a `advisor_sync`. Asi la Lambda no necesita hacer un GET adicional a DANA para generar o actualizar el snapshot.

## Que problema resolvio este enfoque

Durante las pruebas vimos que el enlace de DANA podia contener un `dana` real en el tracking link, pero no siempre lo pasaba correctamente al destino si el HTML usaba placeholders como:

```text
?dana=$f{dana}
```

Cuando llegaba el placeholder literal, la Lambda no podia consultar el registro real.

El camino que si dio visibilidad fue trabajar con un `dana` real y consultar la informacion del contacto por Data Retrieval. De ahi salio la necesidad de dejar documentado que:

- El `dana` debe llegar como valor real.
- La lectura estable probada fue con Basic Auth contra API v1.
- Para el flujo productivo no dependemos de que el correo entregue ese parametro, porque DANA ahora envia los datos completos por nodos API.

## Recomendacion operativa

Para el producto actual:

```bash
DANA_REFRESH_ON_GET=false
```

Con eso, el microsite permanente carga desde DynamoDB y no hace Data Retrieval cada vez que alguien entra.

Data Retrieval queda disponible para:

- Pruebas tecnicas con `dana` real.
- Compatibilidad con flujos antiguos.
- Diagnostico puntual.
- Casos donde DANA decida enviar solo el identificador y no el payload completo.

## Variables relevantes

```bash
DANA_BASE_URL=https://appserv.danaconnect.com
DANA_USERNAME=...
DANA_PASSWORD=...
DANA_DATA_FIELDS=...
DANA_FIELDS_QUERY_PARAM=fieldList
DANA_ACCESS_TOKEN=...
DANA_TOKEN_URL=...
DANA_CLIENT_ID=...
DANA_CLIENT_SECRET=...
DANA_OAUTH_AUTH_METHOD=basic
```

Notas:

- Si `DANA_USERNAME` y `DANA_PASSWORD` existen, se usa v1 Basic con `fields`.
- Si no existen, se usa v2 Bearer/OAuth con `DANA_FIELDS_QUERY_PARAM`.
- `DANA_FIELDS_QUERY_PARAM` no afecta el camino v1 Basic.
