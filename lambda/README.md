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
DANA_DATA_FIELDS=ADVISORID,EMAILASESOR,FOTOASESOR,NOMBREASESOR,TELEFONOASESOR,MICROSITEID,MICROSITEURL,MICROSITEACTIVADO,danaParam,CIUDADASESOR,BIOASESOR,WEBSITEASESOR,CONTACTOASESOR,COTIZADOR_SIMPLIFICADO,COTIZADOR_VITALES,COTIZADOR_AUTO,COTIZADOR_SALUD,COTIZADOR_EMERGENCIAS_MEDICAS,COTIZADOR_PLATINO,COTIZADOR_TRAVEL,COTIZADOR_CR,COTIZADOR_SALUD_PANAMA
DANA_FIELDS_QUERY_PARAM=fieldList
MICROSITE_BASE_URL=https://tudominio.com
MICROSITE_ID_SECRET=valor-largo-privado
DANA_REFRESH_ON_GET=false
DANA_REFRESH_MIN_SECONDS=3600
CORS_ORIGIN=*
```

Si usas `DANA_USERNAME` y `DANA_PASSWORD`, la Lambda llama el endpoint v1 y usa `fields` automaticamente, aunque `DANA_FIELDS_QUERY_PARAM` quede en `fieldList`.

El CSV de prueba para cargar en DANA esta en:

`docs/dana-microsite-asesores-demo.csv`

`ADVISORID` es el identificador unico del asesor generado por Mercantil Seguros. Se muestra dentro del microsite como codigo del asesor, pero no se expone como identificador de la URL publica.

`MICROSITEID` es el identificador interno del microsite guardado en DANA. Tampoco se expone directamente en la URL publica.

La URL publica usa un `PUBLICID` derivado por HMAC a partir de `MICROSITEID`, `ADVISORID` y `MICROSITE_ID_SECRET`. La Lambda guarda ese `PUBLICID` como partition key `advisorId` en DynamoDB y escribe `MICROSITEURL` en DANA con ese valor enmascarado.

Si DANA envia `MICROSITEID` vacio, la Lambda lo genera automaticamente con un hash firmado usando `ADVISORID` y `MICROSITE_ID_SECRET`. Eso hace que el mismo asesor regenere el mismo `MICROSITEID` aunque DANA borre el campo y vuelva a enviar el contacto desde otro correo/evento.

Los campos `COTIZADOR_*` deben cargarse con `SI` o `NO` para habilitar los cotizadores que verá cada asesor.

Durante la activacion la Lambda llama `DANA_TRIGGER_URL` para actualizar:

```bash
MICROSITEID
MICROSITEURL
MICROSITEACTIVADO=SI
```

`MICROSITEID` queda como dato interno en DANA. `MICROSITEURL` queda como el enlace publico enmascarado, por ejemplo `/asesor/3A8F...`, y es el valor que debe usar el segundo correo.

Ese Trigger permite que DANA continue el flujo y envie el segundo correo con el enlace permanente.

Para produccion, `MICROSITE_ID_SECRET` debe ser una cadena privada y estable. Si se cambia despues de activar asesores, los nuevos IDs generados para registros sin `MICROSITEID` podrian cambiar. Los asesores ya activados conservan el `MICROSITEID` guardado en DANA.

Necesaria para resolver enlaces permanentes:

```bash
DYNAMODB_TABLE=MicrositeAdvisors
```

La tabla debe tener partition key `advisorId` tipo string. Ese valor corresponde al `PUBLICID` publico, no al `MICROSITEID` interno. Durante el primer acceso desde DANA, la Lambda guarda el registro normalizado en DynamoDB junto con el `danaIdentifier` y el `micrositeId` interno.

Luego `/asesor/{PUBLICID}` funciona asi:

1. Busca el registro en DynamoDB.
2. Si el registro esta activo, devuelve el ultimo snapshot valido.
3. Si el registro esta inactivo, responde `410` y el frontend no muestra el microsite.
4. No depende de abrir desde DANA ni de que el correo siga vigente.

`DANA_REFRESH_ON_GET=false` es la configuracion recomendada para producto. El enlace permanente carga desde DynamoDB y los cambios llegan por un POST desde un flujo de DANAconnect.

`DANA_REFRESH_MIN_SECONDS` queda disponible solo si se necesita habilitar `refresh=true` como herramienta operativa o de diagnostico.

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

La Lambda resuelve ese identificador contra DynamoDB y devuelve:

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
    "advisorCode": "24657722",
    "products": ["Cotizador Simplificado", "Vitales", "Auto", "Salud"]
  }
}
```

## Sincronizacion desde flujos DANA

Para no consultar DANAconnect cada vez que un cliente abre el microsite, DANA debe avisar a la Lambda cuando ocurra una generacion, actualizacion o inactivacion.

Modo recomendado: el nodo API de DANA envia los campos del contacto directamente en el JSON. Asi la Lambda no depende del `dana` para volver a consultar Data Retrieval. Si el flujo tambien envia `dana`, la Lambda lo usa solo para escribir de vuelta `MICROSITEID`, `MICROSITEURL` y `MICROSITEACTIVADO` en DANA.

Crear o actualizar desde DANA:

```bash
curl -i -X POST "https://xxxxx.lambda-url.region.on.aws/" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"advisor_sync",
    "action":"upsert",
    "dana":"E-xlhBFw__valorRealOpcional",
    "ADVISORID":"24657722",
    "NOMBREASESOR":"Maria Lastra",
    "EMAILASESOR":"mlastra@danaconnect.com",
    "TELEFONOASESOR":"04142563325",
    "FOTOASESOR":"https://...",
    "MICROSITEID":"",
    "MICROSITEACTIVADO":"SI",
    "CIUDADASESOR":"Caracas",
    "BIOASESOR":"Especialista en soluciones de proteccion.",
    "WEBSITEASESOR":"https://...",
    "CONTACTOASESOR":"https://...",
    "COTIZADOR_SIMPLIFICADO":"SI",
    "COTIZADOR_VITALES":"NO",
    "COTIZADOR_AUTO":"SI",
    "COTIZADOR_SALUD":"SI",
    "COTIZADOR_EMERGENCIAS_MEDICAS":"NO",
    "COTIZADOR_PLATINO":"NO",
    "COTIZADOR_TRAVEL":"NO",
    "COTIZADOR_CR":"SI",
    "COTIZADOR_SALUD_PANAMA":"NO"
  }'
```

La Lambda normaliza esa informacion, genera `MICROSITEID` si viene vacio, genera el `PUBLICID` enmascarado, guarda DynamoDB y devuelve en la respuesta:

```bash
MICROSITEID
MICROSITEURL
MICROSITEACTIVADO=SI
```

Si el JSON trae `dana`, la Lambda tambien intenta escribir esos valores en DANA por `DANA_TRIGGER_URL`. Si no trae `dana`, DANA puede tomar esos valores de la respuesta del nodo API para actualizar su lista de contactos y enviar el correo con el enlace final.

Inactivar usando `ADVISORID`:

```bash
curl -i -X POST "https://xxxxx.lambda-url.region.on.aws/" \
  -H "Content-Type: application/json" \
  -d '{"type":"advisor_sync","action":"deactivate","ADVISORID":"24657722"}'
```

Inactivar usando el enlace publico o el `PUBLICID`:

```bash
curl -i -X POST "https://xxxxx.lambda-url.region.on.aws/" \
  -H "Content-Type: application/json" \
  -d '{"type":"advisor_sync","action":"deactivate","publicId":"9F3806A23CEA5138"}'
```

Tambien se mantiene compatibilidad con `"dana":"E-xlhBFw__valorReal"` si algun flujo necesita que la Lambda consulte Data Retrieval, pero no es necesario para el flujo recomendado.

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

`advisor_sync`: sincronizacion operativa desde DANAconnect para altas, actualizaciones e inactivaciones.

## Roadmap backend

El backend definitivo se mantiene en Python. La Lambda puede evolucionar para:

- Consultar DANAconnect y traer el registro del asesor.
- Resolver una URL canonica por asesor.
- Crear o solicitar archivos `.pkpass` para Apple Wallet.
- Crear un pase compatible con Android Wallet.
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
