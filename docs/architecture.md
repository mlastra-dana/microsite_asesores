# Direccion tecnica del microsite

Este documento recoge la direccion funcional conversada para darle forma a la app.

## Flujo esperado

1. La app en Amplify recibe una visita a una URL inicial del asesor.
2. En la primera apertura, una Lambda en Python consulta la Data Retrieval API de DANAconnect para traer el registro del asesor desde la lista de contactos usando `danaparam`.
3. La Lambda normaliza los datos y genera o resuelve una URL limpia por asesor.
4. El usuario queda redirigido o resuelto hacia una URL limpia, por ejemplo `/asesor/2377`.
5. Al abrir `/asesor/{advisorId}`, el frontend consulta la Lambda y la Lambda trae los datos vigentes desde DANAconnect.
6. Desde ese microsite se puede descargar el contacto, solicitar cotizacion y descargar un carnet tipo wallet/pass.
7. Para Apple se contempla generar `.pkpass`.
8. Para Android se contempla un pase compatible con wallet.
9. El asesor puede entrar a su espacio de actualizacion con OTP, sin depender de un clic de correo ni de un token permanente.

## Backend

El backend se hara con AWS Lambda en Python. La Lambda actual esta en `lambda/index.py`, usa librerias estandar para llamar a DANAconnect y usa `boto3` opcional para DynamoDB.

Eventos previstos:

- `landing_provision`: trae el registro desde Data Retrieval API/DANAconnect y devuelve la URL limpia del asesor.
- `get_advisor`: trae el registro actualizado del asesor desde DANAconnect usando el identificador de la URL.
- `pass_request`: genera o solicita el pass de Apple/Android.
- `otp_request`: genera un OTP para el asesor.
- `otp_verify`: valida el OTP antes de permitir cambios.
- `quote_request`: recibe solicitudes de cotizacion.
- `advisor_update`: recibe propuestas de actualizacion de datos.

## Fuente de datos

DANAconnect es la fuente principal para los datos del asesor. La lista de contactos `Microsite_asesores` debe tener, al menos estos codes:

- `ADVISORID`: identificador interno del asesor.
- `MICROSITEID`: identificador opaco usado en la URL publica.
- `NOMBREASESOR`
- `EMAILASESOR`
- `TELEFONOASESOR`
- `CODIGOASESOR`
- `FOTOASESOR`
- `MICROSITEURL`

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

El archivo `docs/dana-microsite-asesores-demo.csv` contiene contactos de prueba listos para cargar en DANA.

## Persistencia opcional

DynamoDB puede usarse como cache o para guardar actividad, pero no es requisito para resolver el microsite. Sus usos opcionales serian:

- Solicitudes de cotizacion.
- Solicitudes de actualizacion.
- OTP temporal con expiracion.
- Historial de generacion de pases wallet.
- Cache temporal del registro normalizado del asesor, si se quisiera reducir llamadas a DANAconnect.

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
- `DYNAMODB_TABLE`: tabla donde guardar registros y eventos.
- `CORS_ORIGIN`: origen permitido para el frontend.
