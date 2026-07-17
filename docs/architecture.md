# Direccion tecnica del microsite

Este documento recoge la direccion funcional conversada para darle forma a la app.

## Flujo esperado

1. Un flujo de DANAconnect detecta una generacion, actualizacion o inactivacion de asesor.
2. Un nodo API de DANAconnect llama la Lambda con `advisor_sync` y envia los campos del asesor en JSON.
3. La Lambda normaliza los datos recibidos y genera o resuelve un `MICROSITEID` interno por asesor.
4. La Lambda genera un `PUBLICID` por HMAC para la URL publica, distinto al `MICROSITEID`.
5. La Lambda guarda el registro normalizado en DynamoDB usando `PUBLICID` como `advisorId`.
6. La Lambda devuelve `MICROSITEID`, `MICROSITEURL` y estado para que DANA actualice la lista de contactos y envie la comunicacion con el link final.
7. Al abrir `/asesor/{advisorId}`, el frontend consulta la Lambda.
8. La Lambda usa DynamoDB para resolver el `PUBLICID` y devuelve el ultimo snapshot valido.
9. Si DANAconnect marca un asesor como inactivo, el flujo llama `advisor_sync` con `action=deactivate`, la Lambda guarda `micrositeActive=false` en DynamoDB y el microsite permanente deja de mostrarse.
11. Desde ese microsite se puede descargar el contacto, solicitar cotizacion y descargar un carnet tipo wallet/pass.
12. Para Apple se contempla generar `.pkpass`.
13. Para Android se contempla un pase compatible con wallet.
14. El asesor puede enviar solicitudes de actualizacion de datos; DANAconnect o un servicio del banco siguen siendo la fuente oficial.

## Backend

El backend se hara con AWS Lambda en Python. La Lambda actual esta en `lambda/index.py`, usa librerias estandar para llamar a DANAconnect y usa `boto3` opcional para DynamoDB.

Eventos previstos:

- `landing_provision`: compatibilidad para traer el registro desde Data Retrieval API/DANAconnect cuando existe `danaparam`.
- `advisor_sync`: endpoint recomendado para que DANAconnect cree, actualice o inactive el snapshot del microsite en DynamoDB enviando los campos del asesor por JSON.
- `get_advisor`: resuelve el `PUBLICID` en DynamoDB.
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

El cliente debe cargar en DANA la informacion basica, el `ADVISORID` unico y las banderas de cotizadores. El flujo de DANA envia esos datos a la Lambda por nodo API. Nosotros generamos el `MICROSITEID` interno usando `ADVISORID` como semilla estable y generamos un `PUBLICID` distinto para no exponer ni el `ADVISORID` ni el `MICROSITEID` real en la URL publica.

Si DANA borra `MICROSITEID` y vuelve a enviar el mismo contacto, la Lambda regenera el mismo `MICROSITEID` y el mismo `PUBLICID` mientras `ADVISORID` se mantenga igual.

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
- Recibir cambios desde DANAconnect con `advisor_sync` para evitar consultas a DANA en cada carga del site.
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
