# Lambda para microsites de asesores

Esta Lambda recibe solicitudes del microsite, consulta la Data Retrieval API de DANAconnect y responde con JSON. No usa dependencias externas adicionales; `boto3` ya viene disponible en AWS Lambda para DynamoDB.

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

Opcion A, token manual temporal:

```bash
DANA_ACCESS_TOKEN=ey...
```

Opcion B, recomendada, OAuth2 client credentials:

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
DANA_DATA_FIELDS=EMAIL,NAME,PHONE_NUMBER,WHATSAPP,CITY,ADVISOR_CODE,ROLE,PHOTO_URL,BIO,PRODUCTS
DANA_FIELDS_QUERY_PARAM=fields
MICROSITE_BASE_URL=https://tudominio.com
CORS_ORIGIN=*
```

Opcional para guardar en DynamoDB:

```bash
DYNAMODB_TABLE=MicrositeAdvisors
```

Si `DYNAMODB_TABLE` no existe, la Lambda imprime el registro o evento en CloudWatch Logs y sigue respondiendo correctamente.

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
  "advisorId": "laura-lepage-a1b2c3",
  "micrositeUrl": "https://tudominio.com/asesor/laura-lepage-a1b2c3",
  "advisor": {
    "name": "Laura Lepage",
    "email": "laura@example.com",
    "phone": "+1 123 456 789"
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

- Consultar la Data Retrieval API o DANAconnect y traer el registro del asesor.
- Generar un slug limpio y una URL canonica.
- Guardar los datos en DynamoDB.
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

Para version con persistencia:

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
