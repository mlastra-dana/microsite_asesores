# Direccion tecnica del microsite

Este documento recoge la direccion funcional conversada para darle forma a la app.

## Flujo esperado

1. La app en Amplify recibe una visita a una URL inicial del asesor.
2. En la primera apertura, una Lambda en Python consulta la Data Retrieval API de DANAconnect para traer el registro del asesor desde la lista de contactos usando `danaparam`.
3. La Lambda normaliza los datos y genera o resuelve un `MICROSITEID` interno por asesor.
4. La Lambda genera un `PUBLICID` por HMAC para la URL publica, distinto al `MICROSITEID`.
5. La Lambda guarda el registro normalizado en DynamoDB usando `PUBLICID` como `advisorId`.
6. El usuario entra hacia una URL limpia y enmascarada, por ejemplo `/asesor/3A8F...`.
7. Al abrir `/asesor/{advisorId}`, el frontend consulta la Lambda.
8. La Lambda usa DynamoDB para resolver el `PUBLICID` y devuelve el ultimo snapshot valido inmediatamente.
9. El frontend pide siempre un refresco en segundo plano con `refresh=true`; si el snapshot ya supero la ventana configurada y DANAconnect responde, la Lambda actualiza DynamoDB y devuelve datos frescos.
10. Si DANAconnect no responde, el microsite permanece disponible con el ultimo snapshot guardado.
11. Desde ese microsite se puede descargar el contacto, solicitar cotizacion y descargar un carnet tipo wallet/pass.
12. Para Apple se contempla generar `.pkpass`.
13. Para Android se contempla un pase compatible con wallet.
14. El asesor puede enviar solicitudes de actualizacion de datos; DANAconnect sigue siendo la fuente oficial.

## Backend

El backend se hara con AWS Lambda en Python. La Lambda actual esta en `lambda/index.py`, usa librerias estandar para llamar a DANAconnect y usa `boto3` opcional para DynamoDB.

Eventos previstos:

- `landing_provision`: trae el registro desde Data Retrieval API/DANAconnect y devuelve la URL limpia del asesor.
- `get_advisor`: resuelve el `PUBLICID` en DynamoDB. Si recibe `refresh=true`, refresca desde DANAconnect y actualiza DynamoDB.
- `pass_request`: genera o solicita el pass de Apple/Android.
- `quote_request`: recibe solicitudes de cotizacion.
- `advisor_update`: recibe propuestas de actualizacion de datos.

## Fuente de datos

DANAconnect es la fuente principal para los datos del asesor. La lista de contactos `Microsite_asesores` debe tener, al menos estos codes:

- `ADVISORID`: identificador unico del asesor generado por Mercantil Seguros. Se muestra como codigo del asesor dentro del microsite.
- `MICROSITEID`: identificador interno del microsite en DANA. Puede cargarse vacio; la Lambda lo genera durante la activacion si no existe. No se expone directamente en la URL publica.
- `MICROSITEURL`: enlace permanente del microsite.
- `MICROSITEACTIVADO`: bandera `SI`/`NO` para marcar que el perfil ya fue preparado.
- `NOMBREASESOR`
- `EMAILASESOR`
- `TELEFONOASESOR`
- `FOTOASESOR`

Campos opcionales recomendados para enriquecer la experiencia:

- `CIUDADASESOR`
- `BIOASESOR`
- `WEBSITEASESOR`
- `CONTACTOASESOR`

Campos de cotizadores por asesor. Cada uno debe usar `SI` o `NO`:

- `COTIZADOR_SIMPLIFICADO`
- `COTIZADOR_VITALES`
- `COTIZADOR_AUTO`
- `COTIZADOR_SALUD`
- `COTIZADOR_EMERGENCIAS_MEDICAS`
- `COTIZADOR_PLATINO`
- `COTIZADOR_TRAVEL`
- `COTIZADOR_CR`
- `COTIZADOR_SALUD_PANAMA`

El cliente debe cargar en DANA la informacion basica, el `ADVISORID` unico y las banderas de cotizadores. Nosotros generamos el `MICROSITEID` interno cuando el asesor abre su enlace desde DANA, y generamos un `PUBLICID` distinto para no exponer ni el `ADVISORID` ni el `MICROSITEID` real en la URL publica.

El archivo `docs/dana-microsite-asesores-demo.csv` contiene contactos de prueba listos para cargar en DANA.

Plantillas de correo:

- `docs/email-asesor-activacion.html`: correo de acceso inicial al microsite.
- `docs/email-asesor-enlace-permanente.html`: correo opcional con `$s{MICROSITEURL}` si se decide enviar un recordatorio.

## Persistencia

DynamoDB es necesario para que el enlace limpio `/asesor/{PUBLICID}` funcione en cualquier navegador y en cualquier momento. La tabla debe tener partition key `advisorId` tipo string.

- Resolver `PUBLICID -> registro normalizado del asesor`.
- Guardar el `MICROSITEID` interno como `micrositeId`.
- Guardar el `danaIdentifier` original para refrescar datos desde DANAconnect.
- Guardar el ultimo snapshot valido por si DANAconnect no responde.
- Controlar la periodicidad de refresco con `DANA_REFRESH_MIN_SECONDS`.
- Solicitudes de cotizacion.
- Solicitudes de actualizacion.
- Historial de generacion de pases wallet.

## Importante

La demo frontend debe seguir funcionando sin backend real. Si `VITE_API_URL` no existe, los eventos se guardan en `localStorage`.

## Variables Lambda

- `DANA_ACCESS_TOKEN`: token Bearer para Data Retrieval API.
- `DANA_TOKEN_URL`: endpoint OAuth2 para obtener access token.
- `DANA_CLIENT_ID`: client id de DANAconnect.
- `DANA_CLIENT_SECRET`: client secret de DANAconnect.
- `DANA_OAUTH_SCOPE`: scope requerido para Data Retrieval API, si DANA lo exige.
- `DANA_OAUTH_AUTH_METHOD`: `basic` o `body`, segun como DANA espere las credenciales.
- `DANA_BASE_URL`: por defecto `https://appserv.danaconnect.com`.
- `DANA_DATA_FIELDS`: campos a pedir a DANAconnect.
- `DANA_FIELDS_QUERY_PARAM`: nombre del query parameter para pedir campos; por defecto `fields`.
- `MICROSITE_BASE_URL`: dominio publico de Amplify o dominio custom.
- `MICROSITE_ID_SECRET`: llave privada estable para generar `MICROSITEID` opacos cuando DANA no los trae.
- `DYNAMODB_TABLE`: tabla donde guardar registros y eventos.
- `CORS_ORIGIN`: origen permitido para el frontend.
