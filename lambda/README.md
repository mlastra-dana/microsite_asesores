# Lambda para microsites de asesores

Esta Lambda recibe solicitudes del microsite, consulta la Data Retrieval API de DANAconnect y responde con JSON. Para el microsite, DANAconnect es la fuente principal de datos del asesor.

## Crear la Lambda

1. En AWS Lambda, crea una nueva funcion.
2. Runtime sugerido: Python 3.12.
3. Copia el contenido de `lambda/index.py` en el editor de codigo.
4. Handler: `index.lambda_handler`.
5. Crea una Function URL o conecta API Gateway.
6. Habilita CORS con:
   - Origin: `*`
   - Headers: `Content-Type,Authorization`
   - Methods: `OPTIONS,POST,GET`

## Variables de entorno

Opcion A, igual al proxy probado en otros proyectos, Basic Auth Data Retrieval v1:

```bash
DANA_USERNAME=usuario@companycode
DANA_PASSWORD=...
```

Opcion B, token manual temporal:

```bash
DANA_ACCESS_TOKEN=ey...
```

Opcion C, OAuth2 client credentials:

```bash
DANA_TOKEN_URL=https://...
DANA_CLIENT_ID=...
DANA_CLIENT_SECRET=...
DANA_OAUTH_SCOPE=...
DANA_OAUTH_AUTH_METHOD=basic
```

`DANA_OAUTH_AUTH_METHOD` puede ser:

- `basic`: envia `client_id:client_secret` en Authorization Basic. Es el modo por defecto.
- `body`: envia `client_id` y `client_secret` en el body form-urlencoded.

Recomendadas:

```bash
DANA_BASE_URL=https://appserv.danaconnect.com
DANA_TRIGGER_URL=https://appserv.danaconnect.com/event/Trigger
DANA_DATA_FIELDS=ADVISORID,CODIGOASESOR,EMAILASESOR,FOTOASESOR,NOMBREASESOR,TELEFONOASESOR,MICROSITEID,MICROSITEURL,MICROSITEACTIVADO,CIUDADASESOR,BIOASESOR,WEBSITEASESOR,CONTACTOASESOR,COTIZADOR_SIMPLIFICADO,COTIZADOR_VITALES,COTIZADOR_AUTO,COTIZADOR_SALUD,COTIZADOR_EMERGENCIAS_MEDICAS,COTIZADOR_PLATINO,COTIZADOR_TRAVEL,COTIZADOR_CR,COTIZADOR_SALUD_PANAMA
DANA_FIELDS_QUERY_PARAM=fieldList
MICROSITE_BASE_URL=https://tudominio.com
MICROSITE_ID_SECRET=valor-largo-privado
CORS_ORIGIN=*
```

Si usas `DANA_USERNAME` y `DANA_PASSWORD`, la Lambda llama el endpoint v1 y usa `fields` automaticamente, aunque `DANA_FIELDS_QUERY_PARAM` quede en `fieldList`.

El CSV de prueba para cargar en DANA esta en:

`docs/dana-microsite-asesores-demo.csv`

`ADVISORID` es el identificador interno del asesor. No se expone en la URL publica. `MICROSITEID` es el identificador opaco que se usa en el enlace publico; si DANA lo envia vacio, la Lambda lo genera automaticamente con un hash firmado usando `MICROSITE_ID_SECRET`.

Los campos `COTIZADOR_*` deben cargarse con `SI` o `NO` para habilitar los cotizadores que verá cada asesor.

Durante la activacion la Lambda llama `DANA_TRIGGER_URL` para actualizar:

```bash
MICROSITEID
MICROSITEURL
MICROSITEACTIVADO=SI
```

Ese Trigger permite que DANA continue el flujo y envie el segundo correo con el enlace permanente.

Para produccion, `MICROSITE_ID_SECRET` debe ser una cadena privada y estable. Si se cambia despues de activar asesores, los nuevos IDs generados para registros sin `MICROSITEID` podrian cambiar. Los asesores ya activados conservan el `MICROSITEID` guardado en DANA.

Opcional para guardar eventos del microsite, como cotizaciones o actualizaciones:

```bash
DYNAMODB_TABLE=MicrositeEvents
```

Si `DYNAMODB_TABLE` no existe, la Lambda imprime los eventos en CloudWatch Logs y sigue respondiendo correctamente. No se requiere DynamoDB para consultar asesores.

## Data Retrieval API usada

La Lambda llama:

```bash
GET https://appserv.danaconnect.com/api/2.0/rest/conversation/data/:danaparam?fields=EMAIL,NAME,PHONE_NUMBER
Authorization: Bearer <access_token>
Accept: application/json
```

Los campos se controlan con `DANA_DATA_FIELDS`. La documentacion tambien menciona `fieldList` como query parameter; por eso el nombre del parametro queda configurable con `DANA_FIELDS_QUERY_PARAM`. El curl de ejemplo oficial usa `fields`, que es el valor por defecto de esta Lambda.

La Lambda obtiene el Bearer token asi:

1. Si existe `DANA_ACCESS_TOKEN`, usa ese token directamente.
2. Si no existe, pide un token con `DANA_TOKEN_URL`, `DANA_CLIENT_ID` y `DANA_CLIENT_SECRET`.
3. Guarda el token en cache de memoria hasta casi su expiracion.

## Provisionar un microsite

Puedes invocar por GET:

```bash
curl -i "https://xxxxx.lambda-url.region.on.aws/?danaparam=123456"
```

Tambien puedes invocar con el nombre usado por DANA:

```bash
curl -i "https://xxxxx.lambda-url.region.on.aws/?dana=123456"
```

O por POST:

```bash
curl -i -X POST "https://xxxxx.lambda-url.region.on.aws/" \
  -H "Content-Type: application/json" \
  -d '{"type":"landing_provision","danaparam":"123456"}'
```

Respuesta esperada:

```json
{
  "ok": true,
  "message": "Microsite provisionado correctamente",
  "type": "landing_provision",
  "advisorId": "9F3806A23CEA5138",
  "micrositeUrl": "https://tudominio.com/asesor/9F3806A23CEA5138",
  "advisor": {
    "name": "Laura Lepage",
    "email": "laura@example.com",
    "phone": "+1 123 456 789"
  }
}
```

## Consultar un asesor por URL limpia

Cuando el frontend abre una URL como:

```bash
https://tudominio.com/asesor/9F3806A23CEA5138
```

puede pedir los datos actuales a la Lambda:

```bash
curl -i "https://xxxxx.lambda-url.region.on.aws/?advisorId=9F3806A23CEA5138"
```

La Lambda resuelve ese identificador contra DANAconnect y devuelve:

```json
{
  "ok": true,
  "type": "get_advisor",
  "advisorId": "9F3806A23CEA5138",
  "micrositeUrl": "https://tudominio.com/asesor/9F3806A23CEA5138",
  "advisor": {
    "advisorId": "9F3806A23CEA5138",
    "internalAdvisorId": "24657722",
    "name": "Maria Lastra",
    "email": "mlastra@danaconnect.com",
    "phone": "04142563325",
    "advisorCode": "2897878",
    "products": ["Cotizador Simplificado", "Vitales", "Auto", "Salud"]
  }
}
```

## Conectar con Amplify

En AWS Amplify, agrega una variable de entorno:

```bash
VITE_API_URL=https://xxxxx.lambda-url.region.on.aws/
```

Luego vuelve a desplegar la app. Si `VITE_API_URL` no existe, el frontend guarda los eventos en `localStorage` para que la demo funcione sin backend.

## Eventos soportados

`quote_request`: solicitud de cotizacion de un cliente.

`advisor_update`: solicitud del asesor para actualizar sus datos.

`pass_request`: solicitud para generar carnet Apple `.pkpass` o pase Android.

`landing_provision`: provisionamiento del microsite desde Data Retrieval API o DANAconnect.

`otp_request`: solicitud de OTP para que el asesor entre a su espacio.

`otp_verify`: validacion del OTP.

## Roadmap backend

El backend definitivo se mantiene en Python. La Lambda puede evolucionar para:

- Consultar DANAconnect y traer el registro del asesor.
- Resolver una URL canonica por asesor.
- Crear o solicitar archivos `.pkpass` para Apple Wallet.
- Crear un pase compatible con Android Wallet.
- Generar y validar OTP para el acceso del asesor.
- Enviar eventos a DANAconnect o EventBridge.

## Recursos AWS necesarios

Minimo para demo conectada a DANAconnect:

- AWS Lambda con runtime Python 3.12.
- Lambda Function URL o API Gateway.
- CloudWatch Logs.
- Variables de entorno de DANAconnect.

Para version con persistencia de eventos:

- DynamoDB table, por ejemplo `MicrositeAdvisors`.
- IAM role de Lambda con permisos:
  - `dynamodb:PutItem`
  - `dynamodb:GetItem`
  - `dynamodb:UpdateItem`
  - `logs:CreateLogGroup`
  - `logs:CreateLogStream`
  - `logs:PutLogEvents`

Modelo simple sugerido para DynamoDB:

- Partition key: `advisorId` string.
- Sort key opcional: `eventId` string.

Si prefieres separar datos, podemos usar dos tablas: `MicrositeAdvisors` y `MicrositeEvents`.
